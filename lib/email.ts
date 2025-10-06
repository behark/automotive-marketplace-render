interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

interface AutomationEmailData {
  userId: string
  type: 'saved_search' | 'price_drop' | 'engagement' | 'lifecycle' | 'social'
  subtype: string
  metadata?: any
}

class EmailService {
  private apiKey: string
  private fromEmail: string
  private fromName: string

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || ''
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@automarket.al'
    this.fromName = process.env.FROM_NAME || 'AutoMarket Shqipëria'
  }

  async sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    try {
      // For development, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:')
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log(`Content: ${text || 'HTML content'}`)
        return true
      }

      // TODO: Implement actual email sending based on available service
      if (process.env.SENDGRID_API_KEY) {
        return await this.sendWithSendGrid({ to, subject, html, text })
      } else if (process.env.RESEND_API_KEY) {
        return await this.sendWithResend({ to, subject, html, text })
      } else {
        // Fallback to console log for now
        console.log('⚠️ No email service configured. Email would be sent:', { to, subject })
        return true
      }

    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  private async sendWithSendGrid({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    // SendGrid implementation
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: this.fromEmail, name: this.fromName },
        subject,
        content: [
          ...(text ? [{ type: 'text/plain', value: text }] : []),
          { type: 'text/html', value: html }
        ]
      })
    })

    return response.ok
  }

  private async sendWithResend({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    // Resend implementation
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
        ...(text ? { text } : {})
      })
    })

    return response.ok
  }

  // Email Templates
  getWelcomeEmail(userName: string): EmailTemplate {
    return {
      subject: 'Welcome to AutoMarket! 🚗',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to AutoMarket!</h1>
          </div>

          <div style="padding: 30px;">
            <p>Hi ${userName},</p>

            <p>Welcome to AutoMarket, Europe's trusted automotive marketplace! We're excited to have you join our community of car buyers and sellers.</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Get Started:</h3>
              <ul style="color: #6b7280; line-height: 1.6;">
                <li>Browse thousands of quality used cars</li>
                <li>Save your favorite cars to compare later</li>
                <li>List your own car for free</li>
                <li>Connect directly with buyers and sellers</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Start Browsing Cars
              </a>
            </div>

            <p>If you have any questions, our support team is here to help. Just reply to this email or visit our <a href="${process.env.NEXTAUTH_URL}/contact" style="color: #2563eb;">contact page</a>.</p>

            <p>Happy car hunting!<br>
            The AutoMarket Team</p>
          </div>

          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>AutoMarket - Your Trusted Automotive Marketplace</p>
            <p>This email was sent to ${userName}. If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </div>
      `,
      text: `Welcome to AutoMarket, ${userName}! Start browsing cars at ${process.env.NEXTAUTH_URL}/listings`
    }
  }

  getNewMessageEmail(recipientName: string, senderName: string, listingTitle: string, messageContent: string): EmailTemplate {
    return {
      subject: `New message about your ${listingTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">New Message from Buyer</h1>
          </div>

          <div style="padding: 30px;">
            <p>Hi ${recipientName},</p>

            <p>You have a new message about your listing: <strong>${listingTitle}</strong></p>

            <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #374151;">Message from ${senderName}:</h4>
              <p style="color: #6b7280; font-style: italic;">"${messageContent}"</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/messages"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reply to Message
              </a>
            </div>

            <p>Respond quickly to increase your chances of selling your car!</p>

            <p>Best regards,<br>
            The AutoMarket Team</p>
          </div>
        </div>
      `,
      text: `New message from ${senderName} about ${listingTitle}: "${messageContent}". Reply at ${process.env.NEXTAUTH_URL}/messages`
    }
  }

  getListingExpiryEmail(userName: string, listingTitle: string, daysLeft: number): EmailTemplate {
    return {
      subject: `Your listing expires in ${daysLeft} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Listing Expiring Soon</h1>
          </div>

          <div style="padding: 30px;">
            <p>Hi ${userName},</p>

            <p>Your listing "<strong>${listingTitle}</strong>" will expire in ${daysLeft} days.</p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Don't let your listing expire!</h3>
              <p style="color: #b45309; margin-bottom: 0;">Renew your listing to keep it visible to potential buyers.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Renew Listing
              </a>
            </div>

            <p>Best regards,<br>
            The AutoMarket Team</p>
          </div>
        </div>
      `,
      text: `Your listing "${listingTitle}" expires in ${daysLeft} days. Renew at ${process.env.NEXTAUTH_URL}/dashboard`
    }
  }

  getPaymentConfirmationEmail(userName: string, amount: number, description: string): EmailTemplate {
    return {
      subject: 'Payment Confirmation - AutoMarket',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Payment Confirmed</h1>
          </div>

          <div style="padding: 30px;">
            <p>Hi ${userName},</p>

            <p>Your payment has been successfully processed!</p>

            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #047857; margin-top: 0;">Payment Details:</h3>
              <p style="color: #065f46;"><strong>Amount:</strong> €${amount}</p>
              <p style="color: #065f46;"><strong>Description:</strong> ${description}</p>
              <p style="color: #065f46;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>Your enhanced features are now active! Thank you for choosing AutoMarket.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Dashboard
              </a>
            </div>

            <p>Best regards,<br>
            The AutoMarket Team</p>
          </div>
        </div>
      `,
      text: `Payment confirmed! €${amount} for ${description}. View dashboard at ${process.env.NEXTAUTH_URL}/dashboard`
    }
  }

  // ========================================
  // ALBANIAN AUTOMATION EMAIL TEMPLATES
  // ========================================

  // Saved Search Alert Templates
  getSavedSearchAlertEmail(userName: string, searchName: string, matches: any[]): EmailTemplate {
    const matchCount = matches.length;
    return {
      subject: `${matchCount} makina të reja për kërkimin tuaj: ${searchName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚗 AutoMarket Shqipëria</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Makina të reja për ju!</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Kemi gjetur <strong>${matchCount} makina të reja</strong> që përputhen me kërkimin tuaj "<strong>${searchName}</strong>".</p>

            <div style="background: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #991b1b;">Makinat e reja:</h3>
              ${matches.map(match => `
                <div style="border-bottom: 1px solid #fee2e2; padding: 15px 0;">
                  <h4 style="margin: 0; color: #7f1d1d;">${match.title}</h4>
                  <p style="margin: 5px 0; color: #991b1b;"><strong>€${(match.price / 100).toLocaleString()}</strong> - ${match.city}</p>
                  <p style="margin: 5px 0; color: #7f1d1d; font-size: 14px;">${match.year} • ${match.mileage.toLocaleString()} km • ${match.fuelType}</p>
                </div>
              `).join('')}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/search?saved=${encodeURIComponent(searchName)}"
                 style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Shiko të gjitha makinat
              </a>
            </div>

            <p>Këto makina janë shtuar kohët e fundit dhe mund të shiten shpejt. Mos humbisni shansin!</p>

            <p>Përshëndetje të ngrohta,<br>
            Ekipi AutoMarket Shqipëria</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              Për të ndryshuar preferencat e kërkimit, vizitoni <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color: #dc2626;">panelin tuaj</a>.
            </p>
          </div>
        </div>
      `,
      text: `${matchCount} makina të reja për kërkimin "${searchName}". Shiko në: ${process.env.NEXTAUTH_URL}/search`
    }
  }

  // Price Drop Alert Templates
  getPriceDropAlertEmail(userName: string, listing: any, oldPrice: number, newPrice: number): EmailTemplate {
    const dropAmount = oldPrice - newPrice;
    const dropPercentage = Math.round((dropAmount / oldPrice) * 100);

    return {
      subject: `💰 Çmim i ulur: ${listing.title} - Kursim €${(dropAmount / 100).toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">💰 Çmim i Ulur!</h1>
            <p style="margin: 5px 0 0 0;">Makina që e keni në listën tuaj të preferuarave</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Kemi një lajm të mirë! Çmimi i makinës që e keni në listën tuaj të preferuarave është ulur:</p>

            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #059669;">
              <h3 style="margin-top: 0; color: #065f46;">${listing.title}</h3>
              <div style="display: flex; align-items: center; margin: 10px 0;">
                <span style="background: #fecaca; color: #991b1b; padding: 5px 10px; border-radius: 4px; text-decoration: line-through; margin-right: 10px;">
                  €${(oldPrice / 100).toLocaleString()}
                </span>
                <span style="background: #059669; color: white; padding: 8px 15px; border-radius: 4px; font-weight: bold; font-size: 18px;">
                  €${(newPrice / 100).toLocaleString()}
                </span>
              </div>
              <p style="color: #065f46; font-weight: bold; margin: 10px 0;">
                🎉 Kursim: €${(dropAmount / 100).toLocaleString()} (-${dropPercentage}%)
              </p>
              <p style="color: #065f46; margin: 5px 0;">${listing.year} • ${listing.mileage.toLocaleString()} km • ${listing.city}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings/${listing.id}"
                 style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Shiko makinën tani
              </a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>💡 Këshillë:</strong> Çmimet e ulura zakonisht tërheqin shumë blerës. Kontaktoni shitësin sa më shpejt!</p>
            </div>

            <p>Përshëndetje të ngrohta,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `Çmimi i ${listing.title} është ulur nga €${(oldPrice / 100).toLocaleString()} në €${(newPrice / 100).toLocaleString()}. Shiko: ${process.env.NEXTAUTH_URL}/listings/${listing.id}`
    }
  }

  // Welcome Series Templates (Albanian)
  getAlbanianWelcomeEmail(userName: string): EmailTemplate {
    return {
      subject: 'Mirë se vini në AutoMarket Shqipëria! 🚗',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🇦🇱 Mirë se vini në AutoMarket!</h1>
            <p style="margin: 5px 0 0 0;">Tregu më i besuar i makinave në Shqipëri</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Mirë se vini në AutoMarket Shqipëria! Jemi të kënaqur që u bashkuat me komunitetin tonë të blerësve dhe shitësve të makinave.</p>

            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #991b1b; margin-top: 0;">Filloni këtu:</h3>
              <ul style="color: #7f1d1d; line-height: 1.8;">
                <li>🔍 Kërkoni mes mijëra makinave cilësore</li>
                <li>❤️ Ruani makinat e preferuara për krahasim</li>
                <li>📱 Listoni makinën tuaj falas</li>
                <li>💬 Komunikoni direkt me blerës dhe shitës</li>
                <li>🔔 Krijoni sinjale kërkimi për makina të reja</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings"
                 style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Shfletoni makinat
              </a>
              <a href="${process.env.NEXTAUTH_URL}/sell"
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Listoni makinën tuaj
              </a>
            </div>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <h4 style="margin-top: 0; color: #1e40af;">💡 A e dinit?</h4>
              <p style="color: #1e3a8a; margin-bottom: 0;">Makinat me foto cilësore dhe përshkrim të detajuar shiten 3 herë më shpejt!</p>
            </div>

            <p>Nëse keni pyetje, ekipi ynë i mbështetjes është këtu për t'ju ndihmuar. Thjesht u përgjigjuni këtij email-i ose vizitoni <a href="${process.env.NEXTAUTH_URL}/contact" style="color: #dc2626;">faqen e kontaktit</a>.</p>

            <p>Gjuetje të këndshme për makinën tuaj të përsosur!<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>

          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>AutoMarket Shqipëria - Tregu më i besuar i makinave</p>
            <p>Ky email u dërgua tek ${userName}. Nëse nuk keni krijuar një llogari, mund ta injoroni këtë email.</p>
          </div>
        </div>
      `,
      text: `Mirë se vini në AutoMarket Shqipëria, ${userName}! Filloni kërkimin në: ${process.env.NEXTAUTH_URL}/listings`
    }
  }

  // Re-engagement Campaign Templates
  getReEngagementEmail(userName: string, daysSinceLastVisit: number): EmailTemplate {
    return {
      subject: `Ju mungoni në AutoMarket! 🚗 Makina të reja ju presin`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Ju mungoni! 💜</h1>
            <p style="margin: 5px 0 0 0;">Makina të reja janë shtuar në AutoMarket</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>E kemi vënë re që nuk keni vizituar AutoMarket prej ${daysSinceLastVisit} ditësh. Gjatë kësaj kohe, janë shtuar qindra makina të reja!</p>

            <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #7c3aed;">
              <h3 style="margin-top: 0; color: #5b21b6;">🆕 Çfarë keni humbur:</h3>
              <ul style="color: #6b21a8; line-height: 1.8;">
                <li>✨ Makina të reja premium në Tiranë dhe Durrës</li>
                <li>💰 Oferta ekskluzive me çmime të ulura</li>
                <li>🚗 Modele të fundit me cilësi të garantuar</li>
                <li>⚡ Makina që shiten shpejt - mos humbisni shansin!</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings?sort=newest"
                 style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Shiko makinat e reja
              </a>
            </div>

            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #059669;">
              <h4 style="margin-top: 0; color: #065f46;">🎯 Këshillë e veçantë:</h4>
              <p style="color: #047857; margin-bottom: 0;">Krijoni një kërkim të ruajtur për të marrë sinjale automatike kur të shtohen makina që ju pëlqejnë!</p>
            </div>

            <p>Jemi këtu për t'ju ndihmuar të gjeni makinën e përfektë. Mirë se u kthyet!</p>

            <p>Përshëndetje të ngrohta,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `Ju mungoni në AutoMarket! Makina të reja ju presin: ${process.env.NEXTAUTH_URL}/listings?sort=newest`
    }
  }

  // Weekly Digest Template
  getWeeklyDigestEmail(userName: string, stats: any): EmailTemplate {
    return {
      subject: '📊 Përmbledhja javore - AutoMarket Shqipëria',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1f2937; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📊 Përmbledhja Javore</h1>
            <p style="margin: 5px 0 0 0;">AutoMarket Shqipëria</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Ja një përmbledhje e shkurtër e aktivitetit të kësaj jave në AutoMarket:</p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0; color: #1e40af; font-size: 24px;">${stats.newListings || 0}</h3>
                <p style="margin: 5px 0 0 0; color: #1e3a8a; font-size: 14px;">Makina të reja</p>
              </div>
              <div style="background: #dcfce7; padding: 15px; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0; color: #166534; font-size: 24px;">${stats.priceDops || 0}</h3>
                <p style="margin: 5px 0 0 0; color: #15803d; font-size: 14px;">Çmime të ulura</p>
              </div>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">🔥 Më të kërkuarat këtë javë:</h3>
              <ul style="color: #b45309; margin-bottom: 0;">
                <li>BMW Seria 3 (2018-2022) - Tiranë</li>
                <li>Volkswagen Golf (2016-2020) - Durrës</li>
                <li>Mercedes C-Class (2017-2021) - Vlorë</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings"
                 style="background: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Eksploroni makinat
              </a>
            </div>

            <p>Keni pyetje ose sugjerime? Na shkruani!</p>

            <p>Javë të mbarë,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `Përmbledhja javore e AutoMarket: ${stats.newListings} makina të reja, ${stats.priceDrops} çmime të ulura. Shiko më shumë: ${process.env.NEXTAUTH_URL}/listings`
    }
  }

  // Listing Expiry Warning Template
  getListingExpiryAlbanianEmail(userName: string, listing: any, daysLeft: number): EmailTemplate {
    return {
      subject: `⚠️ Shpallja juaj skadon për ${daysLeft} ditë: ${listing.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">⚠️ Shpallja skadon së shpejti</h1>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Shpallja juaj "<strong>${listing.title}</strong>" do të skadojë për ${daysLeft} ditë.</p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Mos e lini shpalljen të skadojë!</h3>
              <p style="color: #b45309; margin-bottom: 0;">Rinovoni shpalljen për ta mbajtur të dukshme për blerësit e mundshëm.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Rinovoni shpalljen
              </a>
            </div>

            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <p style="margin: 0; color: #1e3a8a;"><strong>💡 Këshillë:</strong> Shpalljet aktive marrin 5 herë më shumë kontakte se ato që janë afër skadimit!</p>
            </div>

            <p>Përshëndetje të ngrohta,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `Shpallja "${listing.title}" skadon për ${daysLeft} ditë. Rinovoni: ${process.env.NEXTAUTH_URL}/dashboard`
    }
  }

  // Automation helper method
  async sendAutomationEmail(data: AutomationEmailData): Promise<boolean> {
    // This method will be called by the automation system
    // Implementation would fetch user data and send appropriate email
    try {
      // Log automation email attempt
      console.log(`📧 Automation email queued: ${data.type}/${data.subtype} for user ${data.userId}`)

      // In a real implementation, this would:
      // 1. Fetch user data and preferences
      // 2. Check notification limits and quiet hours
      // 3. Generate appropriate email template
      // 4. Send email and log delivery

      return true
    } catch (error) {
      console.error('Automation email failed:', error)
      return false
    }
  }
}

export const emailService = new EmailService()