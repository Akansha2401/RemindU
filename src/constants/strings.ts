/**
 * All user-facing copy for onboarding, auth, setup and attribution (BRD 10: one strings file
 * so Hindi/Hinglish can be added later). Voice: second person, short, no emoji, no exclamation marks.
 * Persona-specific goal/why suggestions live in src/config/onboarding.ts.
 */
export const strings = {
  common: {
    back: "Back",
    continue: "Continue",
    skip: "Skip",
    notNow: "Not now",
    openSettings: "Open settings",
    required: "Required",
    recommended: "Recommended",
    tryAgain: "Something went wrong. Try again.",
    offline: "You're offline. Connect to the internet and try again.",
  },

  onboarding: {
    progress: (step: number, total: number) => `Step ${step} of ${total}`,

    welcome: {
      eyebrow: "RemindU",
      title: "Scroll less. Do what you said you would.",
      subtitle: "Set a goal. Your phone asks you to prove it.",
      cta: "Get started",
      haveAccount: "I already have an account",
    },

    persona: {
      title: "What best describes you?",
      labels: {
        student: "Student",
        exam_prep: "Exam prep",
        professional: "Working professional",
        founder: "Side hustle / founder",
        creator: "Creator",
        teacher: "Teacher",
        other: "Something else",
      },
      descriptions: {
        exam_prep: "JEE, NEET, UPSC, CAT",
      } as Partial<Record<string, string>>,
    },

    goal: {
      title: "What are you working toward?",
      subtitle: "Pick one. You can change it anytime.",
      writeOwn: "Write my own",
      placeholder: "Building my startup, not scrolling",
      tooShort: "At least 3 characters.",
      counter: (n: number, max: number) => `${n}/${max}`,
    },

    why: {
      title: "Why does this matter to you?",
      subtitle: "We'll show this at every check-in.",
      ownWords: "In my own words",
      placeholder: "Because...",
    },

    apps: {
      title: "Which apps pull you away?",
      subtitle: "Only these count against you. Everything else is fine.",
      suggested: "Suggested",
      seeAll: "See all apps",
      hideAll: "Show fewer apps",
      selectAll: "Select all",
      clear: "Clear",
      cta: "Looks right",
      pickOne: "Pick at least one app",
      selectedCount: (n: number) => `${n} app${n === 1 ? "" : "s"} selected`,
      loading: "Finding your apps",
    },

    permissions: {
      title: "A few permissions, and you're set.",
      subtitle: "Each one opens your phone's settings. Come back here when you're done.",
      cta: "Continue",
      items: {
        usage: {
          title: "Usage access",
          body: "Notices when you open the apps you picked. Your usage never leaves your phone.",
          reason: "Android needs this to tell which app is on screen.",
        },
        overlay: {
          title: "Display over other apps",
          body: "Brings your check-in to the front when time is up.",
          reason: "Without it, the check-in can't appear over Instagram or YouTube.",
        },
        notifications: {
          title: "Notifications",
          body: "Shows your session timer and check-in reminders.",
          reason: "Android 13 and up asks before an app can show notifications.",
        },
        battery: {
          title: "Keep RemindU running",
          body: "Stops your phone from closing RemindU in the background.",
          reason: "Some phones close background apps to save battery, which stops your session.",
        },
      },
      brandGuideTitle: (brand: string) => `On ${brand} phones`,
      brandGuideLink: "Full guide for your phone",
    },

    trial: {
      title: (days: number) => `Try RemindU Pro free for ${days} days`,
      maybeLater: "Maybe later",
      today: "Today",
      todayBody: "Full access to every check-in task and insight.",
      reminder: (day: number) => `Day ${day}`,
      reminderBody: "We'll remind you before your trial ends.",
      ends: (day: number) => `Day ${day}`,
      endsBody: (price: string) => `Your trial ends. Then ${price}. Cancel anytime.`,
      cta: "Start free trial",
    },
  },

  auth: {
    signIn: {
      title: "Save your streak.",
      subtitle: "Your goal and apps are ready. Sign in so you never lose progress.",
      titleReturning: "Welcome back.",
      subtitleReturning: "Sign in to pick up where you left off.",
      google: "Continue with Google",
      email: "Continue with email",
      terms: "By continuing you agree to the Terms and Privacy Policy.",
      googleCancelled: "Google sign-in was cancelled.",
    },
    email: {
      title: "What's your email?",
      subtitle: "We'll send you a 6-digit code. No password needed.",
      placeholder: "you@example.com",
      invalid: "Enter a valid email address.",
      cta: "Send code",
      sending: "Sending…",
    },
    verify: {
      title: "Enter your code",
      subtitle: (email: string) => `We sent a 6-digit code to ${email}.`,
      cta: "Verify",
      verifying: "Verifying…",
      wrongCode: "That code didn't work. Check it and try again.",
      expired: "That code has expired. Send a new one.",
      resend: "Send a new code",
      resendIn: (s: number) => `Send a new code in ${s}s`,
      resent: "New code sent.",
      changeEmail: "Use a different email",
    },
  },

  setup: {
    title: "New session",
    subtitle: "Set once. Edit anytime, even mid-session.",
    goalLabel: "Your goal",
    goalPlaceholder: "Building my startup, not scrolling",
    whyLabel: "Why it matters",
    lengthLabel: "Session length",
    lengths: { 60: "1 hr", 120: "2 hr", 180: "3 hr" } as Record<number, string>,
    frequencyLabel: "Check-in frequency",
    frequencies: { once: "Once", every: "Every X hrs", continuous: "Continuous" },
    everyHours: (h: number) => `${h}h`,
    appsLabel: "Distracting apps",
    appsNone: "None selected",
    appsHelper: "Everything else, other than these listed apps, doesn't count against you.",
    edit: "Edit",
    done: "Done",
    startFirst: "Start first session",
    start: "Start Session",
    appLimits: "Daily app limits",
    editAppsTitle: "Distracting apps",
    permissionsTitle: "Permissions",
    disabledGoal: "Add a goal of at least 3 characters.",
    disabledApps: "Pick at least one distracting app.",
    disabledPermissions: "Turn on the required permissions first.",
    banner: {
      title: "RemindU can't check in yet",
      body: (missing: string) => `Turn on ${missing} so your sessions work.`,
      cta: "Fix",
    },
  },

  session: {
    eyebrow: "Session running",
    untilCheckIn: "until time's up",
    left: "left",
    counting: (app: string) => `Counting down — ${app} is open`,
    paused: "Paused — not in a distracting app",
    pausedHelp: "The timer only moves while one of your distracting apps is open.",
    goalLabel: "Your goal",
    whyLabel: "Why it matters",
    appsLabel: "Counting apps",
    end: "End session",
    endConfirmTitle: "End this session?",
    endConfirmBody: "Your timer stops and the session is saved as ended.",
    endConfirm: "End session",
    cancel: "Keep going",
    viewSession: "View session",
    timeUpEyebrow: "Time's up",
    timeUpTitle: "This is what you said you wanted.",
    timeUpBody: "You've used your distraction time for this session.",
    keepGoing: (label: string) => `Start next ${label}`,
    finish: "Finish session",
    noSession: "No session running.",
    backToSetup: "Back to setup",
  },

  attribution: {
    title: "Nice, first session done.",
    subtitle: "Quick one: how did you find RemindU?",
    options: {
      creator: "A creator",
      instagram: "Instagram",
      youtube: "YouTube",
      friend: "A friend",
      other: "Other",
    },
    creatorLabel: "Which creator?",
    creatorPlaceholder: "Name or handle (optional)",
    cta: "Done",
  },
} as const;
