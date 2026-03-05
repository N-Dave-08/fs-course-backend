-- Add postive age check
ALTER TABLE "users"
ADD CONSTRAINT "users_age_positive_check"
CHECK ("age" >= 0);