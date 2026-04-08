-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Relation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromType" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "toType" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "metadata" TEXT
);
INSERT INTO "new_Relation" ("fromId", "fromType", "id", "metadata", "relationType", "toId", "toType") SELECT "fromId", "fromType", "id", "metadata", "relationType", "toId", "toType" FROM "Relation";
DROP TABLE "Relation";
ALTER TABLE "new_Relation" RENAME TO "Relation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
