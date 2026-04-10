/**
 * Google Drive Integration Utility (Client-side OAuth)
 * Permite que cualquier usuario inicie sesión con su cuenta de Google 
 * y suba archivos directamente a su Drive.
 */

const CLIENT_ID = 'ESCRIBE_AQUI_TU_CLIENT_ID'; // El usuario deberá reemplazar esto
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient = null;
let accessToken = null;

/**
 * Inicializa el cliente de identidad de Google.
 * Debe llamarse cuando la página cargue.
 */
export const initGoogleContext = () => {
  return new Promise((resolve) => {
    const checkGSI = setInterval(() => {
      if (window.google && window.google.accounts) {
        clearInterval(checkGSI);
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.access_token) {
              accessToken = response.access_token;
            }
          },
        });
        resolve(true);
      }
    }, 500);
  });
};

/**
 * Solicita el token y sube el archivo
 */
export const saveToGoogleDrive = async (blob, fileName) => {
  try {
    // 1. Solicitar token si no lo tenemos
    if (!accessToken) {
      await new Promise((resolve, reject) => {
        tokenClient.callback = (resp) => {
          if (resp.error) reject(resp);
          accessToken = resp.access_token;
          resolve();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    }

    // 2. Preparar la subida Multipart
    const metadata = {
      name: fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error en la subida');
    }

    return await response.json();
  } catch (error) {
    console.error('Google Drive Error:', error);
    throw error;
  }
};
