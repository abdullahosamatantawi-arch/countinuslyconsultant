/**
 * Service to handle AI-powered data extraction from documents
 */

export interface LicenseExtractions {
    company_name: string;
    license_number: string;
    success: boolean;
    message?: string;
}

/**
 * Converts a File object to a Base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data:image/jpeg;base64, prefix
            const base64Content = result.split(',')[1];
            resolve(base64Content);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Sends a license file (PDF or Image) to AI for data extraction
 * Implements a retry mechanism if the backend (n8n) is slow to respond
 */
export async function extractLicenseData(file: File, maxRetries = 3): Promise<LicenseExtractions> {
    console.log(`Starting AI extraction for file: ${file.name} (Max Retries: ${maxRetries})`);
    
    const base64Data = await fileToBase64(file);
    let attempts = 0;

    while (attempts < maxRetries) {
        attempts++;
        try {
            console.log(`Attempt ${attempts} of ${maxRetries}...`);
            
            const response = await fetch('/n8n-extract-license', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_name: file.name,
                    file_type: file.type,
                    file_data: base64Data,
                    timestamp: new Date().toISOString(),
                    attempt: attempts
                }),
            });

            if (!response.ok) {
                throw new Error(`AI Extraction failed with status: ${response.status}`);
            }

            const rawText = await response.text();
            
            if (!rawText || rawText.trim() === '') {
                // If empty and we have retries left, wait and try again
                if (attempts < maxRetries) {
                    console.warn(`Attempt ${attempts} returned empty. Waiting 3s for retry...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }
                throw new Error('الاستجابة من المحرك فارغة بعد عدة محاولات. يرجى إعادة رفع الملف.');
            }

            let result;
            try {
                result = JSON.parse(rawText);
            } catch (e) {
                // If invalid JSON and we have retries left, wait and try again
                if (attempts < maxRetries) {
                    console.warn(`Attempt ${attempts} returned invalid JSON. Waiting 3s for retry...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }
                throw new Error('تنسيق البيانات المستلمة غير صالح. يرجى التأكد من وضوح صورة الرخصة.');
            }
            
            // n8n often wraps AI results in an 'output' object
            const data = result.output || result;
            
            // Map n8n specific fields to our application fields
            const extractedCompanyName = data.engineering_office_name || data.company_name || '';
            const extractedLicenseNumber = data.license_number || '';

            console.log('[AI Extraction] Success Details:', { extractedCompanyName, extractedLicenseNumber });

            // Success!
            return {
                company_name: String(extractedCompanyName).trim(),
                license_number: String(extractedLicenseNumber).trim(),
                success: !!(extractedCompanyName || extractedLicenseNumber),
                message: result.message
            };

        } catch (error: any) {
            console.error(`Extraction Attempt ${attempts} Error:`, error);
            
            if (attempts < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue;
            }

            return {
                company_name: '',
                license_number: '',
                success: false,
                message: error.message
            };
        }
    }

    return { company_name: '', license_number: '', success: false, message: 'فشلت جميع محاولات الاستخراج.' };
}
