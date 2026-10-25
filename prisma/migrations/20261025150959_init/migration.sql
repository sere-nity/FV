-- CreateTable
CREATE TABLE "creator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fanvue_user_uuid" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "voice_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "shelf_item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creator_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT,
    "quote_text" TEXT,
    "title" TEXT NOT NULL,
    "image_url" TEXT,
    "description" TEXT,
    "embed_html" TEXT,
    "tags" TEXT,
    "creator_note" TEXT NOT NULL,
    "embedding" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shelf_item_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creator_id" TEXT NOT NULL,
    "fanvue_user_uuid" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fan_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fan_id" TEXT NOT NULL,
    "fanvue_message_uuid" TEXT,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sent_at" DATETIME NOT NULL,
    CONSTRAINT "message_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "fan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "taste_profile" (
    "fan_id" TEXT NOT NULL PRIMARY KEY,
    "summary" TEXT NOT NULL,
    "liked" TEXT,
    "wants_next" TEXT,
    "wanted_types" TEXT,
    "avoid" TEXT,
    "embedding" TEXT,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "taste_profile_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "fan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fan_id" TEXT NOT NULL,
    "shelf_item_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pick_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "fan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pick_shelf_item_id_fkey" FOREIGN KEY ("shelf_item_id") REFERENCES "shelf_item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_fanvue_user_uuid_key" ON "creator"("fanvue_user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "creator_handle_key" ON "creator"("handle");

-- CreateIndex
CREATE INDEX "shelf_item_creator_id_idx" ON "shelf_item"("creator_id");

-- CreateIndex
CREATE INDEX "shelf_item_type_idx" ON "shelf_item"("type");

-- CreateIndex
CREATE UNIQUE INDEX "fan_fanvue_user_uuid_key" ON "fan"("fanvue_user_uuid");

-- CreateIndex
CREATE INDEX "fan_creator_id_idx" ON "fan"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_fanvue_message_uuid_key" ON "message"("fanvue_message_uuid");

-- CreateIndex
CREATE INDEX "message_fan_id_idx" ON "message"("fan_id");

-- CreateIndex
CREATE INDEX "message_sent_at_idx" ON "message"("sent_at");

-- CreateIndex
CREATE INDEX "pick_fan_id_idx" ON "pick"("fan_id");

-- CreateIndex
CREATE INDEX "pick_status_idx" ON "pick"("status");
