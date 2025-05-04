CREATE TABLE IF NOT EXISTS "admin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" integer,
	"details" text,
	"ip_address" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"pin" text NOT NULL,
	"role" text DEFAULT 'admin',
	"last_login" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer,
	"event_type" text NOT NULL,
	"event_data" text,
	"user_location" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"session_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"priority" text DEFAULT 'normal',
	"target_audience" text DEFAULT 'all',
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "creators" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text,
	"profile_image" text,
	"bio" text,
	"joined_date" text,
	"followers" integer DEFAULT 0,
	"rating" text,
	"social_links" text,
	CONSTRAINT "creators_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"total_views" integer DEFAULT 0,
	"contact_clicks" integer DEFAULT 0,
	"views_by_day" text,
	"views_by_hour" text,
	"location_breakdown" text,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"service_type" text NOT NULL,
	"country" text DEFAULT 'Liberia' NOT NULL,
	"county" text NOT NULL,
	"city" text NOT NULL,
	"community" text NOT NULL,
	"description" text,
	"detailed_description" text,
	"features" text,
	"pricing" text,
	"images" text,
	"operating_hours" text,
	"available" integer DEFAULT 1 NOT NULL,
	"view_count" integer DEFAULT 0,
	"tags" text,
	"last_updated" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "announcements" ADD CONSTRAINT "announcements_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_stats" ADD CONSTRAINT "service_stats_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
