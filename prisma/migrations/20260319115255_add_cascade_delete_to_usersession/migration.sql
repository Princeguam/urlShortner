-- DropForeignKey
ALTER TABLE "UserSessions" DROP CONSTRAINT "UserSessions_UserId_fkey";

-- AddForeignKey
ALTER TABLE "UserSessions" ADD CONSTRAINT "UserSessions_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
