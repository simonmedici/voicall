import { db } from "../lib/db/index";
import { user, account, subscription } from "../lib/db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function createTestUser() {
  const userId = crypto.randomUUID();
  const testEmail = "test@voicall.ch";
  const testPassword = "Test1234!";
  
  console.log("Creating test user...");
  console.log("Email:", testEmail);
  console.log("Password:", testPassword);
  
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  const existingUsers = await db.select().from(user).where(eq(user.email, testEmail)).limit(1);
  
  if (existingUsers.length > 0) {
    const existingUser = existingUsers[0];
    console.log("Test user already exists, updating subscription...");
    
    const existingSubs = await db.select().from(subscription).where(eq(subscription.userId, existingUser.id)).limit(1);
    
    if (existingSubs.length > 0) {
      await db.update(subscription)
        .set({
          tier: "enterprise",
          status: "active",
          minutesIncluded: -1,
          minutesUsed: 0
        })
        .where(eq(subscription.userId, existingUser.id));
      console.log("Subscription updated to enterprise!");
    } else {
      await db.insert(subscription).values({
        id: crypto.randomUUID(),
        userId: existingUser.id,
        tier: "enterprise",
        status: "active",
        minutesIncluded: -1,
        minutesUsed: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
      console.log("Enterprise subscription created!");
    }
    return;
  }
  
  await db.insert(user).values({
    id: userId,
    name: "Test User",
    email: testEmail,
    emailVerified: true,
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log("User created!");
  
  await db.insert(account).values({
    id: crypto.randomUUID(),
    userId: userId,
    accountId: userId,
    providerId: "credential",
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log("Account created!");
  
  await db.insert(subscription).values({
    id: crypto.randomUUID(),
    userId: userId,
    tier: "enterprise",
    status: "active",
    minutesIncluded: -1,
    minutesUsed: 0,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });
  console.log("Enterprise subscription created!");
  
  console.log("\n✅ Test user created successfully!");
  console.log("Email: test@voicall.ch");
  console.log("Password: Test1234!");
}

createTestUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
