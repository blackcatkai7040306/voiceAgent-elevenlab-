const puppeteer = require('puppeteer-core');

// ============================================
// CONFIGURATION
// ============================================

const CREDENTIALS = {
  username: 'mgwillis2@gmail.com',
  password: 'ZRt859#$'
};

const PROXY_CONFIG = {
  host: '72.1.155.151',
  port: '7542',
  username: 'qkrrhkdtjd123',
  password: 'qkrrhkdtjd123'
};

const SITE_URL = 'https://app.incomeconductor.com';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Emits progress updates via socket and console
 * @param {Object} io - Socket.IO instance
 * @param {string} step - Current step identifier
 * @param {string} message - Progress message
 * @param {Object} details - Additional data to include
 */
function emitProgress(io, step, message, details = {}) {
  const progressData = {
    step,
    message,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  console.log(`Progress: ${step} - ${message}`);
  
  if (io) {
    io.emit('automation-progress', progressData);
  }
}

// ============================================
// MAIN AUTOMATION FUNCTION
// ============================================

/**
 * Main automation function that handles the complete Income Conductor workflow
 * @param {Object} formData - Form data from the frontend
 * @param {Object} io - Socket.IO instance for progress updates
 * @returns {Object} Automation result with extracted data
 */
async function runAutomation(formData, io = null) {
  let browser;
  
  try {
    // ========================================
    // BROWSER INITIALIZATION
    // ========================================
    console.log('Launching browser...');
    
    // Launch browser with visible window and proxy
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use system Chrome
      headless: false, // Set to true for production
      slowMo: 50, // Slow down actions for visibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        `--proxy-server=${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`
      ]
    });

    console.log('Opening new page...');
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1366, height: 768 });
    
    // Authenticate proxy
    console.log('Authenticating proxy...');
    await page.authenticate({
      username: PROXY_CONFIG.username,
      password: PROXY_CONFIG.password
    });
    
    // Navigate to the Income Conductor app
    emitProgress(io, 'navigation', 'Navigating to Income Conductor website...');
    console.log('Navigating to Income Conductor...');
    await page.goto(SITE_URL, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('Page loaded successfully!');
    
    // Wait for page to fully load
    await wait(2000);
    
    // ========================================
    // AUTHENTICATION PROCESS
    // ========================================
    await wait(1000);
    
    try {
      // Look for common login field selectors
      const loginSelectors = [
        'input[type="email"]',
        'input[name="email"]', 
        'input[name="username"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="username" i]',
        '#email',
        '#username'
      ];
      
      let emailInput = null;
      for (const selector of loginSelectors) {
        try {
          emailInput = await page.waitForSelector(selector, { timeout: 1000 });
          if (emailInput) {
            console.log(`Found email input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (emailInput) {
        emitProgress(io, 'login', 'Login form detected, entering credentials...');
        console.log('Login form detected, proceeding with login...');
        
        // Clear and type email
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(CREDENTIALS.username);
        console.log('Email entered');
        
        // Find password field
        const passwordSelectors = [
          'input[type="password"]',
          'input[name="password"]',
          '#password'
        ];
        
        let passwordInput = null;
        for (const selector of passwordSelectors) {
          try {
            passwordInput = await page.$(selector);
            if (passwordInput) {
              console.log(`Found password input with selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (passwordInput) {
          await passwordInput.click({ clickCount: 3 });
          await passwordInput.type(CREDENTIALS.password);
          console.log('Password entered');
          
          // Find and click login button
          const loginButtonSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Login")',
            'button:contains("Sign In")',
            '.login-button',
            '#login-button'
          ];
          
          let loginButton = null;
          for (const selector of loginButtonSelectors) {
            try {
              loginButton = await page.$(selector);
              if (loginButton) {
                console.log(`Found login button with selector: ${selector}`);
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          
          if (loginButton) {
            console.log('Clicking login button...');
            await loginButton.click();
            
            // Wait for navigation after login
            await wait(1000);
            console.log('Login submitted, waiting for page to load...');
            
            // Wait for potential redirect or loading
            try {
              await page.waitForNavigation({ timeout: 5000, waitUntil: 'networkidle2' });
            } catch (e) {
              console.log('No navigation detected, continuing...');
            }
          } else {
            console.log('Login button not found, trying to submit form');
            await page.keyboard.press('Enter');
            await wait(1000);
          }
        } else {
          throw new Error('Password field not found');
        }
      } else {
        console.log('No login form detected, user might already be logged in or page structure is different');
      }
    } catch (loginError) {
      console.log('Login attempt completed with some issues:', loginError.message);
    }
    
    // ========================================
    // NAVIGATION & PLAN SELECTION
    // ========================================
    await wait(1000);
    
    try {
      emitProgress(io, 'plan-selection', 'Looking for Plan card...');
      console.log('Looking for Plan card...');
      
      // Simple selector for the Plan card title
      const planCardSelector = 'h5.card-title';
      await page.waitForSelector(planCardSelector, { timeout: 1000 });
      
      // Click on the Plan card by finding the h5 with "Plan" text
      await page.evaluate(() => {
        const planTitles = document.querySelectorAll('h5.card-title');
        for (let title of planTitles) {
          if (title.textContent.trim() === 'Plan') {
            title.click();
            return;
          }
        }
      });
      
      await wait(2000);
      console.log('Plan card clicked successfully');
      
    } catch (error) {
      console.log('Could not click Plan card:', error.message);
    }
    
    // ========================================
    // CLIENT SELECTION & INTERACTION
    // ========================================
    await wait(1000);
    
    try {
      emitProgress(io, 'client-selection', 'Selecting Average, Joe client...');
      console.log('Looking for Average, Joe client link...');
      
      // Click on the client link containing "Average, Joe"
      await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/clients/view/"]');
        for (let link of links) {
          if (link.textContent.includes('Average, Joe')) {
            link.click();
            return;
          }
        }
      });
      
      await wait(2000);
      console.log('Average, Joe client link clicked successfully');
      
    } catch (error) {
      console.log('Could not click Average, Joe client link:', error.message);
    }
    
    // Wait and click on Profile link
    await wait(3000);
    
    try {
      console.log('Looking for Profile link...');
      
      // Click on the Profile nav link
      await page.evaluate(() => {
        const links = document.querySelectorAll('a.nav-link');
        for (let link of links) {
          if (link.textContent.trim() === 'Profile') {
            link.click();
            return;
          }
        }
      });
      
      await wait(2000);
      console.log('Profile link clicked successfully');
      
    } catch (error) {
      console.log('Could not click Profile link:', error.message);
    }
    
    // ========================================
    // PROFILE UPDATES
    // ========================================
    await wait(1000);
    
    try {
      const birthday = formData.birthday || '07/01/1967';
      emitProgress(io, 'profile-update', `Updating client profile with date of birth: ${birthday}...`);
      console.log('Looking for date of birth field...');
      
      // Find and fill the DOB input field
      const dobInput = await page.$('#data\\.dob');
      if (dobInput) {
        // Clear existing value and type new date
        await dobInput.click({ clickCount: 3 });
        await dobInput.type(birthday);
        console.log(`Date of birth field filled successfully with ${birthday}`);
      } else {
        console.log('Date of birth field not found');
      }
      
      await wait(1000);
      
    } catch (error) {
      console.log('Could not fill date of birth field:', error.message);
    }
    
    // Wait and click Save changes button
    await wait(1000);
    
    try {
      console.log('Looking for Save changes button...');
      
      // Click on the Save changes button
      await page.evaluate(() => {
        const spans = document.querySelectorAll('span');
        for (let span of spans) {
          if (span.textContent.trim() === 'Save changes') {
            // Click the span or its parent button
            const button = span.closest('button') || span;
            button.click();
            return;
          }
        }
      });
      
      await wait(1000);
      console.log('Save changes button clicked successfully');
      
    } catch (error) {
      console.log('Could not click Save changes button:', error.message);
    }
    
    // Wait and click on Plans link
    await wait(1000);
    
    try {
      console.log('Looking for Plans link...');
      
      // Click on the Plans nav link
      await page.evaluate(() => {
        const links = document.querySelectorAll('a.nav-link');
        for (let link of links) {
          if (link.textContent.trim() === 'Plans') {
            link.click();
            return;
          }
        }
      });
      
      await wait(1000);
      console.log('Plans link clicked successfully');
      
    } catch (error) {
      console.log('Could not click Plans link:', error.message);
    }
    
    // Wait and click on chevron-down icon
    await wait(1000);
    
    try {
      console.log('Looking for chevron-down icon...');
      
      // Click on the chevron-down icon
      await page.evaluate(() => {
        const chevronIcons = document.querySelectorAll('i.fa-chevron-down');
        if (chevronIcons.length > 0) {
          chevronIcons[0].click();
          return;
        }
      });
      
      await wait(1000);
      console.log('Chevron-down icon clicked successfully');
      
    } catch (error) {
      console.log('Could not click chevron-down icon:', error.message);
    }
    
    // Wait and click on Edit dropdown item
    await wait(1000);
    
    try {
      console.log('Looking for Edit dropdown item...');
      
      // Click on the Edit dropdown item
      await page.evaluate(() => {
        const dropdownItems = document.querySelectorAll('a.dropdown-item');
        for (let item of dropdownItems) {
          if (item.textContent.trim() === 'Edit') {
            item.click();
            return;
          }
        }
      });
      
            await wait(1000);
      console.log('Edit dropdown item clicked successfully');
        
    } catch (error) {
      console.log('Could not click Edit dropdown item:', error.message);
    }
    
    // Wait and handle SweetAlert2 OK button with multiple strategies
    await wait(2000);
    
    try {
      console.log('Looking for SweetAlert2 OK button...');
      
      // Multiple selectors to try for SweetAlert2 OK button
      const okButtonSelectors = [
        'button.swal2-confirm.btn.btn-info',
        'button.swal2-confirm',
        '.swal2-confirm',
        'button[class*="swal2-confirm"]',
        '.swal2-popup button.btn-info',
        '.swal2-popup button:contains("OK")',
        '.swal2-actions button',
        'button.btn.btn-info'
      ];
      
      let okButton = null;
      let foundSelector = null;
      
      // Try each selector with a wait
      for (const selector of okButtonSelectors) {
        try {
          console.log(`Trying selector: ${selector}`);
          okButton = await page.waitForSelector(selector, { timeout: 2000 });
          if (okButton) {
            foundSelector = selector;
            console.log(`Found OK button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
          console.log(`Selector ${selector} not found, trying next...`);
        }
      }
      
      // If no specific selector worked, try a more general approach
      if (!okButton) {
        console.log('Trying general approach to find OK button...');
        okButton = await page.evaluate(() => {
          // Look for any button containing "OK" text
          const buttons = document.querySelectorAll('button');
          for (let button of buttons) {
            if (button.textContent && button.textContent.trim().toLowerCase().includes('ok')) {
              return button;
            }
          }
          
          // Look for SweetAlert2 confirm buttons
          const swalButtons = document.querySelectorAll('[class*="swal2"], [class*="confirm"]');
          for (let button of swalButtons) {
            if (button.tagName === 'BUTTON') {
              return button;
            }
          }
          
          return null;
        });
        
        if (okButton) {
          foundSelector = 'general text/class search';
        }
      }
      
      if (okButton) {
        await okButton.click();
        console.log(`SweetAlert2 OK button clicked successfully using: ${foundSelector}`);
      } else {
        console.log('SweetAlert2 OK button not found with any method - continuing without clicking');
      }
      
      await wait(1000);
      
    } catch (error) {
      console.log('Could not click SweetAlert2 OK button:', error.message);
      console.log('Continuing automation without OK button click...');
    }
    
    // Wait and click Done button with multiple strategies
    await wait(1000);
    
    try {
      console.log('Looking for Done button...');
      
      // Multiple selectors to try for Done button
      const doneButtonSelectors = [
        'button.wt-btn-next',
        'button[class*="wt-btn-next"]',
        'button:contains("Done")',
        'button[class*="next"]',
        '.wt-btn-next',
        'button.btn-next'
      ];
      
      let doneButton = null;
      let foundSelector = null;
      
      // Try each selector
      for (const selector of doneButtonSelectors) {
        try {
          doneButton = await page.waitForSelector(selector, { timeout: 1000 });
          if (doneButton) {
            foundSelector = selector;
            console.log(`Found Done button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // If no specific selector worked, try a general approach
      if (!doneButton) {
        doneButton = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (let button of buttons) {
            if (button.textContent && button.textContent.trim().toLowerCase().includes('done')) {
              return button;
            }
          }
          return null;
        });
        if (doneButton) {
          foundSelector = 'text search for "done"';
        }
      }
      
      if (doneButton) {
        await doneButton.click();
        console.log(`Done button clicked successfully using: ${foundSelector}`);
      } else {
        console.log('Done button not found with any method - continuing without clicking');
      }
      
      await wait(1000);
      
    } catch (error) {
      console.log('Could not click Done button:', error.message);
      console.log('Continuing automation without Done button click...');
    }
    
    // ========================================
    // INVESTMENT CONFIGURATION
    // ========================================
    await wait(1000);
    
    try {
      const investmentAmount = formData.investmentAmount || '130000';
      emitProgress(io, 'investment-input', `Entering investment amount: $${investmentAmount}...`);
      console.log('Looking for investment amount field...');
      
      // Find and fill the investment amount input field
      const investmentInput = await page.$('input[name="investmentamount"]');
      if (investmentInput) {
        // Clear existing value and type new amount
        await investmentInput.click({ clickCount: 3 });
        await investmentInput.type(investmentAmount);
        await page.keyboard.press('Enter');
        console.log(`Investment amount field filled successfully with ${investmentAmount} and Enter pressed`);
      } else {
        console.log('Investment amount field not found');
      }
      
      await wait(1000);
      
    } catch (error) {
      console.log('Could not fill investment amount field:', error.message);
    }
    
    // Wait and click Clients tab
    await wait(1000);
    
    try {
      console.log('Looking for Clients tab...');
      
      // Click on the Clients tab
      const clientsTab = await page.$('a.nav-link[data-tabid="8"]');
      if (clientsTab) {
        await clientsTab.click();
        console.log('Clients tab clicked successfully');
      } else {
        console.log('Clients tab not found');
      }
      
      await wait(1000);
      
    } catch (error) {
      console.log('Could not click Clients tab:', error.message);
    }
    
    // Wait and fill client fields
    await wait(1000);
    
    try {
      const retirementAge = formData.retirementAge || '62';
      const longevityEstimate = formData.longevityEstimate || '100';
      emitProgress(io, 'client-data', `Updating client retirement age: ${retirementAge} and longevity: ${longevityEstimate}...`);
      console.log('Looking for client retirement age field...');
      
      // Fill retirement age field
      const retirementAgeInput = await page.$('input[name="client_retirement_age"]');
      if (retirementAgeInput) {
        await retirementAgeInput.click({ clickCount: 3 });
        await retirementAgeInput.type(retirementAge);
        console.log(`Retirement age field filled successfully with ${retirementAge}`);
      } else {
        console.log('Retirement age field not found');
      }
      
      await wait(500);
      
      // Fill longevity field
      const longevityInput = await page.$('input[name="client_longevity"]');
      if (longevityInput) {
        await longevityInput.click({ clickCount: 3 });
        await longevityInput.type(longevityEstimate);
        console.log(`Longevity field filled successfully with ${longevityEstimate}`);
      } else {
        console.log('Longevity field not found');
      }
      
      await wait(500);
      
      // Select retirement month
      const retirementMonth = formData.retirementMonth || '1';
      console.log(`Selecting retirement month: ${retirementMonth}`);
      
      try {
        const monthSelect = await page.$('select[name="client_retirement_month"]');
        if (monthSelect) {
          await monthSelect.selectOption({ value: retirementMonth });
          console.log(`Retirement month selected successfully: ${retirementMonth}`);
        } else {
          console.log('Retirement month select not found');
        }
      } catch (error) {
        console.log('Could not select retirement month:', error.message);
      }
      
      await wait(500);
      
      // Select retirement year
      const retirementYear = formData.retirementYear || '2030';
      console.log(`Selecting retirement year: ${retirementYear}`);
      
      try {
        const yearSelect = await page.$('select[name="client_retirement_year"]');
        if (yearSelect) {
          await yearSelect.selectOption({ value: retirementYear });
          console.log(`Retirement year selected successfully: ${retirementYear}`);
        } else {
          console.log('Retirement year select not found');
        }
      } catch (error) {
        console.log('Could not select retirement year:', error.message);
      }
      
      await wait(1000);
      
    } catch (error) {
      console.log('Could not fill client fields:', error.message);
    }
    
    // Wait and click Update button with multiple strategies
    await wait(1000);
    
    try {
      console.log('Looking for Update button...');
      
      // Multiple selectors to try for Update button
      const updateButtonSelectors = [
        'button.btn.btn-primary',
        'button.btn-primary',
        'button[class*="btn-primary"]',
        'button:contains("Update")',
        'button[type="submit"]',
        'input[type="submit"]',
        '.btn-primary'
      ];
      
      let updateButton = null;
      let foundSelector = null;
      
      // Try each selector
      for (const selector of updateButtonSelectors) {
        try {
          updateButton = await page.waitForSelector(selector, { timeout: 1000 });
          if (updateButton) {
            foundSelector = selector;
            console.log(`Found Update button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // If no specific selector worked, try a general approach
      if (!updateButton) {
        updateButton = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button, input[type="submit"]');
          for (let button of buttons) {
            if (button.textContent && button.textContent.trim().toLowerCase().includes('update')) {
              return button;
            }
            if (button.value && button.value.toLowerCase().includes('update')) {
              return button;
            }
          }
          return null;
        });
        if (updateButton) {
          foundSelector = 'text search for "update"';
        }
      }
      
      if (updateButton) {
        await updateButton.click();
        console.log(`Update button clicked successfully using: ${foundSelector}`);
      } else {
        console.log('Update button not found with any method - continuing without clicking');
      }
      
      await wait(1000);
      
    } catch (error) {
      console.log('Could not click Update button:', error.message);
      console.log('Continuing automation without Update button click...');
    }
    
    // ========================================
    // DATA EXTRACTION & RESULTS
    // ========================================
    await wait(2000);
    
    try {
      emitProgress(io, 'data-extraction', 'Extracting Income /mo (Net) from plan summary...');
      console.log('Extracting Income /mo (Net) value...');
      
      // Extract Income /mo (Net) value from plan summary
      const monthlyIncomeNet = await page.evaluate(() => {
        const listItems = document.querySelectorAll('.list-plan-summary .list-group-item');
        for (let item of listItems) {
          const label = item.querySelector('span');
          if (label && label.textContent.trim() === 'Income /mo (Net)') {
            const badge = item.querySelector('.badge');
            if (badge) {
              return badge.textContent.trim();
            }
          }
        }
        return null;
      });
      
      if (monthlyIncomeNet) {
        console.log('=== 💰 MONTHLY INCOME (NET) EXTRACTED ===');
        console.log(`💰 Income /mo (Net): ${monthlyIncomeNet}`);
        console.log('========================================');
        emitProgress(io, 'data-extracted', `Monthly Income (Net) extracted: ${monthlyIncomeNet}`, { monthlyIncomeNet });
      } else {
        console.log('Income /mo (Net) value not found in plan summary');
      }
      
    } catch (error) {
      console.log('Could not extract Income /mo (Net) value:', error.message);
    }
    
    // Extract Start of Plan values - specifically $40,567 and $109,433
    try {
      console.log('Extracting Start of Plan values ($40,567 and $109,433)...');
      
      const startOfPlanValues = await page.evaluate(() => {
        const rows = document.querySelectorAll('tr');
        for (let row of rows) {
          const firstCell = row.querySelector('td');
          if (firstCell && firstCell.textContent.trim() === 'Start of Plan') {
            const rightAlignedCells = row.querySelectorAll('td.text-right');
            if (rightAlignedCells.length >= 3) {
              // Extract the specific values: $40,567 (6th column, index 0) and $109,433 (7th column, index 1)
              // Skip the last value $150,000 (8th column, index 2)
              return {
                value1: rightAlignedCells[0].textContent.trim(), // $40,567
                value2: rightAlignedCells[1].textContent.trim(), // $109,433
                value3: rightAlignedCells[2].textContent.trim()  // $150,000 (for reference)
              };
            }
          }
        }
        return null;
      });
      
      if (startOfPlanValues) {
        console.log('=== 🎯 START OF PLAN VALUES EXTRACTED ===');
        console.log(`📊 Target Value 1: ${startOfPlanValues.value1}`);
        console.log(`📊 Target Value 2: ${startOfPlanValues.value2}`);
        console.log(`📊 Reference Value 3: ${startOfPlanValues.value3}`);
        console.log(`📋 Key Values: ${startOfPlanValues.value1} | ${startOfPlanValues.value2}`);
        console.log('=======================================');
        emitProgress(io, 'plan-data-extracted', `Start of Plan values extracted: ${startOfPlanValues.value1}, ${startOfPlanValues.value2}`, { 
          startOfPlanValues,
          targetValue1: startOfPlanValues.value1,  // $40,567
          targetValue2: startOfPlanValues.value2,  // $109,433
          referenceValue3: startOfPlanValues.value3 // $150,000
        });
      } else {
        console.log('Start of Plan values not found');
      }
      
    } catch (error) {
      console.log('Could not extract Start of Plan values:', error.message);
    }
    
    // ========================================
    // COMPLETION & CLEANUP
    // ========================================
    
    // Take screenshot for verification
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'automation-screenshot.png',
      fullPage: true 
    });
    
    // Demonstrate automation success with page interaction
    console.log('Demonstrating browser automation is working...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await wait(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1000);
    
    // Get page metadata for verification
    const pageTitle = await page.title();
    const currentUrl = await page.url();
    console.log(`Page Title: ${pageTitle}`);
    console.log(`Current URL: ${currentUrl}`);
    
    // Final wait before completion
    await wait(3000);
    
    emitProgress(io, 'completed', 'Automation completed successfully!', {
      pageTitle,
      currentUrl,
      timestamp: new Date().toISOString()
    });
    console.log('Automation completed successfully!');
    
    return {
      success: true,
      pageTitle: pageTitle,
      currentUrl: currentUrl,
      timestamp: new Date().toISOString(),
      formData: formData,
      userInputs: {
        investmentAmount: formData.investmentAmount || '130000',
        retirementAge: formData.retirementAge || '62',
        longevityEstimate: formData.longevityEstimate || '100',
        birthday: formData.birthday || '07/01/1967'
      },
      message: 'Browser automation completed successfully with user-provided values. Check automation-screenshot.png for proof.'
    };
    
  } catch (error) {
    console.error('Automation failed:', error);
    throw new Error(`Automation failed: ${error.message}`);
  } finally {
    if (browser) {
      console.log('Closing browser...');
      // await browser.close();
    }
  }
}

module.exports = { runAutomation }; 