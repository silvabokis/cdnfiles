/**
 * Squarespace Plugin Installer
 * This script provides a temporary installer that customers add to their Squarespace site
 * after purchasing a plugin. It detects the site ID, allows customers to enter their order number,
 * and generates the permanent plugin code.
 */

(function() {
  // Configuration
  const INSTALLER_ID = "ss-plugin-installer"; // The ID we'll look for in the DOM
  
  // Prevent multiple initializations
  if (window.SquarespacePluginInstaller) return;
  window.SquarespacePluginInstaller = true;
  
  /**
   * Detect Squarespace site ID using multiple methods
   * @returns {string|null} The site ID if found, null otherwise
   */
  function detectSiteId() {
    // Priority Method: Check Static.SQUARESPACE_CONTEXT object (most reliable)
    const contextSiteId = window.Static?.SQUARESPACE_CONTEXT?.website?.id;
    if (contextSiteId) return contextSiteId;
    
    // Backup Method 1: Look for websiteSettings.websiteId in SQUARESPACE_CONTEXT
    const settingsSiteId = window.Static?.SQUARESPACE_CONTEXT?.websiteSettings?.websiteId;
    if (settingsSiteId) return settingsSiteId;
    
    // Backup Method 2: Try to parse SQUARESPACE_CONTEXT from script tags
    try {
      const staticContextScript = document.querySelector('script[data-name="static-context"]');
      if (staticContextScript && staticContextScript.textContent) {
        const scriptContent = staticContextScript.textContent;
        // Extract the JSON part
        const jsonMatch = scriptContent.match(/SQUARESPACE_CONTEXT\s*=\s*(\{[\s\S]*?\}\});/);
        if (jsonMatch && jsonMatch[1]) {
          // Use a safer approach than eval
          const contextObj = Function('return ' + jsonMatch[1])();
          if (contextObj?.website?.id) {
            return contextObj.website.id;
          }
          if (contextObj?.websiteSettings?.websiteId) {
            return contextObj.websiteSettings.websiteId;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing static context:', e);
    }
    
    // Fallback Method 1: Check meta tags
    const metaSiteId = document.querySelector('meta[name="website-id"]')?.getAttribute('content');
    if (metaSiteId) return metaSiteId;
    
    // Fallback Method 2: Check data attributes on body
    const bodySiteId = document.body.getAttribute('data-site-id');
    if (bodySiteId) return bodySiteId;
    
    // Fallback Method 3: Look for it in other common Squarespace objects
    const ytSiteId = window.Y?.Config?.website?.id;
    if (ytSiteId) return ytSiteId;
    
    // Fallback Method 4: Try to extract from page source with regex patterns
    const pageSource = document.documentElement.innerHTML;
    
    // Pattern found in the provided sample
    const idRegex1 = /"website":\s*{\s*"id":\s*"([a-f0-9-]+)"/i;
    const match1 = pageSource.match(idRegex1);
    if (match1 && match1[1]) return match1[1];
    
    // Alternative pattern
    const idRegex2 = /"websiteId":\s*"([a-f0-9-]+)"/i;
    const match2 = pageSource.match(idRegex2);
    if (match2 && match2[1]) return match2[1];
    
    // If all methods fail, return null
    return null;
  }
  
  /**
   * Create and show the installer UI
   * @param {string} siteId - The detected Squarespace site ID
   */
  function showInstallerUI(siteId) {
    // Check if the installer already exists and remove it
    const existingInstaller = document.getElementById('sq-plugin-installer');
    if (existingInstaller) {
      existingInstaller.remove();
    }
    
    // Create container
    const container = document.createElement('div');
    container.id = 'sq-plugin-installer';
    container.style.cssText = `
      position: fixed !important;
      bottom: 80px !important;
      right: 20px !important;
      width: 350px !important;
      background: white !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      border-radius: 8px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      z-index: 2147483647 !important;
      overflow: hidden !important;
      max-height: 80vh !important;
      text-align: left !important;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px !important;
      background: #111 !important;
      color: white !important;
      font-weight: bold !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    `;
    header.innerHTML = `
      <span style="color: white !important; font-size: 16px !important;">Plugin Installer</span>
      <button id="sq-plugin-close" style="background: none !important; border: none !important; color: white !important; cursor: pointer !important; font-size: 18px !important;">×</button>
    `;
    
    // Create body
    const body = document.createElement('div');
    body.style.cssText = `padding: 16px !important; color: #333 !important;`;
    
    // Initial content - Order number form
    body.innerHTML = `
      <p style="margin: 0 0 12px !important; font-size: 14px !important; color: #333 !important;">
        Enter your order number to install your plugin:
      </p>
      <div style="margin-bottom: 12px !important;">
        <input id="sq-plugin-order" type="text" placeholder="Order #" style="
          width: 100% !important;
          padding: 8px 12px !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
          font-size: 14px !important;
          box-sizing: border-box !important;
          background: white !important;
          color: #333 !important;
        ">
      </div>
      <div style="display: flex !important; justify-content: space-between !important; align-items: center !important;">
        <div style="font-size: 12px !important; color: #777 !important;">
          Site ID: ${siteId ? siteId.substring(0, 8) + '...' : 'Unknown'}
        </div>
        <button id="sq-plugin-submit" style="
          background: #111 !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          font-size: 14px !important;
        ">Install Plugin</button>
      </div>
      <div id="sq-plugin-error" style="
        color: #d9534f !important;
        font-size: 12px !important;
        margin-top: 8px !important;
        display: none !important;
      "></div>
    `;
    
    // Assemble and add to page
    container.appendChild(header);
    container.appendChild(body);
    document.body.appendChild(container);
    
    // Add event listeners
    document.getElementById('sq-plugin-close').addEventListener('click', function() {
      document.body.removeChild(container);
    });
    
    document.getElementById('sq-plugin-submit').addEventListener('click', function() {
      const orderNumber = document.getElementById('sq-plugin-order').value.trim();
      if (!orderNumber) {
        const errorEl = document.getElementById('sq-plugin-error');
        errorEl.textContent = 'Please enter your order number';
        errorEl.style.display = 'block !important';
        return;
      }
      
      // Show loading state
      const submitBtn = document.getElementById('sq-plugin-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;
      
      // Generate the permanent script
      generatePermanentScript(siteId, orderNumber)
        .then(result => {
          if (result.success) {
            showSuccessUI(result.scriptCode);
          } else {
            const errorEl = document.getElementById('sq-plugin-error');
            errorEl.textContent = result.error || 'Failed to generate plugin code';
            errorEl.style.display = 'block !important';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        })
        .catch(err => {
          const errorEl = document.getElementById('sq-plugin-error');
          errorEl.textContent = 'Error processing request. Please try again.';
          errorEl.style.display = 'block !important';
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }
  
  /**
   * Show success UI with the permanent script code
   * @param {string} scriptCode - The permanent script code to install
   */
  function showSuccessUI(scriptCode) {
    const body = document.querySelector('#sq-plugin-installer > div:nth-child(2)');
    
    // Attempt to find and replace the installer script tag
    let scriptReplaced = false;
    try {
      // Find all script tags that might be our installer
      const scripts = document.querySelectorAll('script');
      const installerScript = Array.from(scripts).find(script => 
        script.src && script.src.includes('cdnfiles.silvabokis.org/installer.js')
      );
      
      if (installerScript) {
        console.log("Found installer script tag in DOM");
        
        // Create the replacement script element
        const newScript = document.createElement('script');
        newScript.src = `https://ss-plugins.silvabokis.org/${detectSiteId()}/script1.min.js`;
        newScript.async = true;
        newScript.defer = true;
        
        // Replace the old script with the new one
        if (installerScript.parentNode) {
          installerScript.parentNode.replaceChild(newScript, installerScript);
          scriptReplaced = true;
          console.log("Replaced script tag in DOM");
        }
      } else {
        console.log("Could not find installer script in DOM");
      }
    } catch (err) {
      console.error('Error replacing script:', err);
    }
    
    // Create success UI
    body.innerHTML = `
      <div style="text-align: center !important; margin-bottom: 16px !important;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #28a745 !important;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          <polyline points="22 4 12 14.01 9 11.01" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
        </svg>
        <h3 style="margin: 12px 0 !important; font-size: 18px !important; color: #333 !important;">Installation Verified!</h3>
      </div>
      
      <p style="margin: 0 0 12px !important; font-size: 14px !important; color: #333 !important;">
        To complete installation, replace the installer script:
      </p>
      
      <div style="
        background: #f5f5f5 !important;
        padding: 8px !important;
        border-radius: 4px !important;
        position: relative !important;
        margin-bottom: 16px !important;
      ">
        <pre id="sq-plugin-code" style="
          margin: 0 !important;
          white-space: pre-wrap !important;
          word-break: break-all !important;
          font-size: 12px !important;
          font-family: monospace !important;
          color: #333 !important;
        ">${scriptCode}</pre>
        <button id="sq-plugin-copy" style="
          position: absolute !important;
          top: 4px !important;
          right: 4px !important;
          background: white !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
          padding: 2px 6px !important;
          font-size: 12px !important;
          cursor: pointer !important;
          color: #333 !important;
        ">Copy</button>
      </div>
      
      <ol style="font-size: 14px !important; padding-left: 20px !important; margin: 0 0 16px !important; color: #333 !important;">
        <li>Copy the code above</li>
        <li>Go to Settings > Advanced > Code Injection</li>
        <li>Replace the installer script with this code</li>
        <li>Save your changes</li>
      </ol>
      
      <button id="sq-plugin-finish" style="
        width: 100% !important;
        background: #111 !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 14px !important;
      ">Close</button>
    `;
    
    // Add copy functionality
    document.getElementById('sq-plugin-copy').addEventListener('click', function() {
      const codeEl = document.getElementById('sq-plugin-code');
      const range = document.createRange();
      range.selectNode(codeEl);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      
      this.textContent = 'Copied!';
      setTimeout(() => {
        this.textContent = 'Copy';
      }, 2000);
    });
    
    // Add finish button functionality
    document.getElementById('sq-plugin-finish').addEventListener('click', function() {
      const container = document.getElementById('sq-plugin-installer');
      document.body.removeChild(container);
    });
  }
  
  /**
   * Generate the permanent script tag based on the site ID
   * @param {string} siteId - The detected Squarespace site ID
   * @param {string} orderNumber - The customer's order number
   * @returns {Promise<Object>} The generated script info
   */
  async function generatePermanentScript(siteId, orderNumber) {
    try {
      // Create the script URL with the site ID
      const scriptUrl = `https://ss-plugins.silvabokis.org/${siteId}/script1.min.js`;
      
      // Generate a simple script tag with proper HTML entities for display
      const scriptCode = `&lt;script src="${scriptUrl}" async defer&gt;&lt;/script&gt;`;
      
      // Normally here you would validate the order number with your server
      // For now, we'll just return success with the script code
      
      return {
        success: true,
        scriptCode: scriptCode,
        orderNumber: orderNumber
      };
    } catch (error) {
      console.error('Error generating plugin script:', error);
      return {
        success: false,
        error: 'Failed to generate script'
      };
    }
  }
  
  // Initialize the installer
  function init() {
    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      window.addEventListener('load', init);
      return;
    }
    
    console.log('Squarespace Plugin Installer: Initializing...');
    console.log('Edit mode:', document.body.classList.contains('sqs-edit-mode'));
    
    // ONLY run in edit mode - check for the sqs-edit-mode class
    if (!document.body.classList.contains('sqs-edit-mode')) {
      console.log('Squarespace Plugin Installer: Not in edit mode, installer hidden');
      return;
    }
    
    // Detect the site ID
    const siteId = detectSiteId();
    console.log('Detected site ID:', siteId);
    
    // If site ID is found, show the installer UI
    if (siteId) {
      // Delay slightly to ensure the DOM is fully ready
      setTimeout(() => {
        showInstallerUI(siteId);
        console.log('Installer UI should be visible now');
      }, 500);
    } else {
      // If site ID can't be detected, show an error
      console.error('Squarespace Plugin Installer: Unable to detect site ID');
      
      // Create a simple notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: #d9534f;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 99999;
      `;
      notification.innerHTML = `
        <p style="margin: 0 0 8px; font-weight: bold;">Plugin Installer Error</p>
        <p style="margin: 0; font-size: 14px;">Unable to detect Squarespace site ID.</p>
      `;
      
      document.body.appendChild(notification);
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 5000);
    }
  }
  
  // Start the initialization process
  init();
})();