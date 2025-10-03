import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { waitUntil } from "cloudflare:workers";
import { protectedProcedure, router } from "../trpc.ts";
import { schema } from "../../db/client.ts";
import { createStripeCustomerAndSubscriptionForOrganization } from "../../integrations/stripe/stripe.ts";

export const organizationRouter = router({
  // List all organizations the user has access to
  list: protectedProcedure.query(async ({ ctx }) => {
    const userOrganizations = await ctx.db.query.organizationUserMembership.findMany({
      where: eq(schema.organizationUserMembership.userId, ctx.user.id),
      with: {
        organization: true,
      },
    });

    return userOrganizations.map(({ organization, role }) => ({
      id: organization.id,
      name: organization.name,
      role,
      stripeCustomerId: organization.stripeCustomerId,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    }));
  }),

  // Create a new organization
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Organization name is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create the organization
      const [organization] = await ctx.db
        .insert(schema.organization)
        .values({ name: input.name })
        .returning();

      if (!organization) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create organization",
        });
      }

      // Make the current user the owner
      await ctx.db.insert(schema.organizationUserMembership).values({
        organizationId: organization.id,
        userId: ctx.user.id,
        role: "owner",
      });

      // Create a default estate for this organization
      const [estate] = await ctx.db
        .insert(schema.estate)
        .values({
          name: `${input.name} Estate`,
          organizationId: organization.id,
        })
        .returning();

      if (!estate) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create default estate",
        });
      }

      // Create Stripe customer and subscribe in the background (non-blocking)
      waitUntil(
        createStripeCustomerAndSubscriptionForOrganization(ctx.db, organization, ctx.user).catch(
          () => {
            // Error is already logged in the helper function
          },
        ),
      );

      return {
        organization,
        estate,
      };
    }),

  // Get organization by ID
  get: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify the user is a member of this organization
      const organization = await ctx.db.query.organization.findFirst({
        where: eq(schema.organization.id, input.organizationId),
        with: {
          members: {
            where: eq(schema.organizationUserMembership.userId, ctx.user.id),
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Organization ${input.organizationId} not found`,
        });
      }

      if (!organization.members || organization.members.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `User ${ctx.user.id} does not have access to this organization ${input.organizationId}`,
        });
      }

      return organization;
    }),

  // Update organization name
  updateName: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1, "Organization name is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user is an owner or admin of this organization
      const membership = await ctx.db.query.organizationUserMembership.findFirst({
        where: (membership, { and, eq }) =>
          and(
            eq(membership.organizationId, input.organizationId),
            eq(membership.userId, ctx.user.id),
          ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `User ${ctx.user.id} does not have access to this organization ${input.organizationId}`,
        });
      }

      if (membership.role !== "owner" && membership.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update organization settings",
        });
      }

      // Update the organization name
      const [updatedOrganization] = await ctx.db
        .update(schema.organization)
        .set({ name: input.name })
        .where(eq(schema.organization.id, input.organizationId))
        .returning();

      if (!updatedOrganization) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update organization",
        });
      }

      return updatedOrganization;
    }),

  // List all members of an organization
  listMembers: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify the user is a member of this organization
      const membership = await ctx.db.query.organizationUserMembership.findFirst({
        where: (membership, { and, eq }) =>
          and(
            eq(membership.organizationId, input.organizationId),
            eq(membership.userId, ctx.user.id),
          ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `User ${ctx.user.id} does not have access to this organization ${input.organizationId}`,
        });
      }

      // Get all members of the organization
      const members = await ctx.db.query.organizationUserMembership.findMany({
        where: eq(schema.organizationUserMembership.organizationId, input.organizationId),
        with: {
          user: true,
        },
      });

      return members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
        createdAt: m.createdAt,
      }));
    }),

  // Update a member's role
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        role: z.enum(["member", "admin", "owner", "guest"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user is an owner or admin of this organization
      const currentUserMembership = await ctx.db.query.organizationUserMembership.findFirst({
        where: (membership, { and, eq }) =>
          and(
            eq(membership.organizationId, input.organizationId),
            eq(membership.userId, ctx.user.id),
          ),
      });

      if (!currentUserMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `User ${ctx.user.id} does not have access to this organization ${input.organizationId}`,
        });
      }

      if (currentUserMembership.role !== "owner" && currentUserMembership.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update member roles",
        });
      }

      // Prevent users from changing their own role
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      // Get the membership to update
      const membershipToUpdate = await ctx.db.query.organizationUserMembership.findFirst({
        where: (membership, { and, eq }) =>
          and(
            eq(membership.organizationId, input.organizationId),
            eq(membership.userId, input.userId),
          ),
      });

      if (!membershipToUpdate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found in this organization",
        });
      }

      // Update the member's role
      const [updatedMembership] = await ctx.db
        .update(schema.organizationUserMembership)
        .set({ role: input.role })
        .where(eq(schema.organizationUserMembership.id, membershipToUpdate.id))
        .returning();

      if (!updatedMembership) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update member role",
        });
      }

      return updatedMembership;
    }),
});
