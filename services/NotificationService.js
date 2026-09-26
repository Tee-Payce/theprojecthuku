// Reminder calculations for builds where native notifications are unavailable.

export const requestNotificationPermissions = async () => {
  // Mock function for Expo Go compatibility
  return true;
};

export const scheduleFeedReminders = async (batchId, batchName, startDate) => {
  console.log(`Feed reminders scheduled for ${batchName}`);
  return true;
};

export const scheduleVaccinationReminders = async (batchId, batchName, startDate) => {
  console.log(`Vaccination reminders scheduled for ${batchName}`);
  return true;
};

export const getUpcomingReminders = (batches) => {
  const reminders = [];
  const today = new Date();
  
  batches.forEach(batch => {
    if (batch.status !== 'active') return;
    
    const startDate = new Date(batch.startDate);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    // Feed change reminders (2 days advance)
    if (daysDiff === 10) { // Day 12 feed change in 2 days
      reminders.push({
        title: 'Feed Change Due Soon',
        message: 'Switch to Grower feed in 2 days (Day 12)',
        batch: batch.name,
        priority: 'high',
        icon: '🌾'
      });
    }
    
    if (daysDiff === 24) { // Day 26 feed change in 2 days
      reminders.push({
        title: 'Feed Change Due Soon',
        message: 'Switch to Finisher feed in 2 days (Day 26)',
        batch: batch.name,
        priority: 'high',
        icon: '🌾'
      });
    }
    
    // Vaccination reminders (1 day advance)
    if (daysDiff === 9) { // MA5clone30 spray tomorrow
      reminders.push({
        title: 'Vaccination Due Tomorrow',
        message: 'MA5clone30 spray vaccination (Days 10-12)',
        batch: batch.name,
        priority: 'critical',
        icon: '💉'
      });
    }
    
    if (daysDiff === 12) { // IBD tomorrow
      reminders.push({
        title: 'Vaccination Due Tomorrow',
        message: 'IBD vaccination (Days 13-14)',
        batch: batch.name,
        priority: 'critical',
        icon: '💉'
      });
    }
    
    if (daysDiff === 18) { // Second MA5clone30 spray tomorrow
      reminders.push({
        title: 'Vaccination Due Tomorrow',
        message: 'MA5clone30 spray vaccination (Days 19-21)',
        batch: batch.name,
        priority: 'critical',
        icon: '💉'
      });
    }
    
    if (daysDiff === 23) { // Finisher program tomorrow
      reminders.push({
        title: 'Vaccination Program Due Tomorrow',
        message: 'Start finisher vaccination program (Days 24-42)',
        batch: batch.name,
        priority: 'medium',
        icon: '💉'
      });
    }
  });
  
  return reminders;
};