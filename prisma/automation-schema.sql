-- ========================================
-- AUTOMATION & NOTIFICATION MODELS
-- ========================================

-- Saved search criteria for automated alerts
model SavedSearch {
  id              String   @id @default(cuid())
  userId          String
  name            String   // User-defined name for the search
  searchCriteria  Json     // Complete search parameters
  alertFrequency  String   @default("daily") // instant, daily, weekly
  emailEnabled    Boolean  @default(true)
  smsEnabled      Boolean  @default(false)
  pushEnabled     Boolean  @default(true)
  isActive        Boolean  @default(true)
  lastRunAt       DateTime?
  lastMatchAt     DateTime?
  totalMatches    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isActive])
  @@index([alertFrequency])
  @@map("saved_searches")
}

-- Price drop monitoring for favorited listings
model PriceDropWatch {
  id              String   @id @default(cuid())
  userId          String
  listingId       String
  originalPrice   Int      // Price when first watched
  currentPrice    Int      // Current price
  minimumDrop     Int      @default(500) // Minimum drop in cents to trigger alert
  percentageDrop  Float    @default(5.0) // Minimum percentage drop to trigger alert
  isActive        Boolean  @default(true)
  lastCheckedAt   DateTime @default(now())
  alertsTriggered Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing         Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([userId, listingId])
  @@index([isActive])
  @@index([lastCheckedAt])
  @@map("price_drop_watches")
}

-- User automation preferences
model AutomationPreferences {
  id                    String   @id @default(cuid())
  userId                String   @unique

  // Communication preferences
  emailNotifications    Boolean  @default(true)
  smsNotifications      Boolean  @default(false)
  pushNotifications     Boolean  @default(true)

  // Timing preferences
  quietHoursStart       Int?     // Hour of day (0-23)
  quietHoursEnd         Int?     // Hour of day (0-23)
  timezone              String   @default("Europe/Tirane")

  // Frequency preferences
  maxDailyEmails        Int      @default(5)
  maxDailySms           Int      @default(2)
  weeklyDigest          Boolean  @default(true)
  weeklyDigestDay       Int      @default(1) // 1=Monday, 7=Sunday

  // Content preferences
  language              String   @default("sq") // Albanian
  priceAlerts           Boolean  @default(true)
  newListingAlerts      Boolean  @default(true)
  marketInsights        Boolean  @default(true)
  promotionalEmails     Boolean  @default(false)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("automation_preferences")
}

-- Notification delivery log
model NotificationLog {
  id              String   @id @default(cuid())
  userId          String
  type            String   // saved_search, price_drop, engagement, lifecycle, social
  subtype         String   // specific notification subtype
  channel         String   // email, sms, push, webhook
  recipientInfo   Json     // Contact details used
  subject         String?
  content         String?
  status          String   @default("pending") // pending, sent, delivered, failed, bounced
  metadata        Json?    // Additional data
  sentAt          DateTime?
  deliveredAt     DateTime?
  failureReason   String?
  createdAt       DateTime @default(now())

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
  @@map("notification_logs")
}

-- Automation job queue
model AutomationJob {
  id              String   @id @default(cuid())
  type            String   // saved_search_check, price_drop_check, engagement_campaign, etc.
  priority        Int      @default(0) // Higher number = higher priority
  payload         Json     // Job-specific data
  status          String   @default("pending") // pending, running, completed, failed, cancelled
  attempts        Int      @default(0)
  maxAttempts     Int      @default(3)
  scheduledFor    DateTime @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  failureReason   String?
  result          Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([type])
  @@index([status])
  @@index([priority])
  @@index([scheduledFor])
  @@map("automation_jobs")
}

-- Social media posting automation
model SocialMediaPost {
  id              String   @id @default(cuid())
  listingId       String?
  platform        String   // facebook, instagram, twitter
  postType        String   // featured_listing, market_update, success_story
  content         String
  mediaUrls       Json?    // Array of image/video URLs
  hashtags        Json?    // Array of hashtags
  scheduledFor    DateTime
  status          String   @default("scheduled") // scheduled, posted, failed, cancelled
  platformPostId  String?  // ID from social platform
  engagement      Json?    // Likes, shares, comments data
  postedAt        DateTime?
  failureReason   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  listing         Listing? @relation(fields: [listingId], references: [id], onDelete: SetNull)

  @@index([platform])
  @@index([status])
  @@index([scheduledFor])
  @@map("social_media_posts")
}

-- Email campaign management
model EmailCampaign {
  id              String   @id @default(cuid())
  name            String
  type            String   // welcome_series, re_engagement, price_drop_digest, market_insights
  status          String   @default("draft") // draft, scheduled, sending, sent, cancelled
  targetAudience  Json     // Criteria for selecting recipients
  templateData    Json     // Email template and content
  scheduledFor    DateTime?
  sentAt          DateTime?
  stats           Json?    // Open rates, click rates, etc.
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  deliveries      EmailDelivery[]

  @@index([type])
  @@index([status])
  @@index([scheduledFor])
  @@map("email_campaigns")
}

-- Individual email delivery tracking
model EmailDelivery {
  id              String   @id @default(cuid())
  campaignId      String
  userId          String
  emailAddress    String
  status          String   @default("pending") // pending, sent, delivered, opened, clicked, bounced, complained
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  bounceReason    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  campaign        EmailCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@index([campaignId])
  @@index([userId])
  @@index([status])
  @@map("email_deliveries")
}

-- SMS delivery tracking
model SmsDelivery {
  id              String   @id @default(cuid())
  userId          String
  phoneNumber     String
  carrier         String?  // vodafone_al, telekom_al, one_al
  messageType     String   // alert, verification, marketing
  content         String
  status          String   @default("pending") // pending, sent, delivered, failed
  cost            Int?     // Cost in cents
  messageId       String?  // Provider message ID
  sentAt          DateTime?
  deliveredAt     DateTime?
  failureReason   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([messageType])
  @@map("sms_deliveries")
}

-- User engagement tracking
model UserEngagement {
  id              String   @id @default(cuid())
  userId          String
  engagementType  String   // login, search, listing_view, message_sent, favorite_added
  metadata        Json?    // Additional engagement data
  sessionId       String?
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())

  @@index([userId])
  @@index([engagementType])
  @@index([createdAt])
  @@map("user_engagement")
}