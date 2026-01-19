const VT_API_URL = 'https://www.virustotal.com/api/v3';
const MAX_INLINE_UPLOAD_BYTES = 32 * 1024 * 1024;
const ANALYSIS_POLL_RETRIES = 5;
const ANALYSIS_POLL_DELAY_MS = 1000;

function getApiKey() {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    const error = new Error('VirusTotal API key not configured');
    error.code = 'VT_NOT_CONFIGURED';
    throw error;
  }
  return apiKey;
}

async function getUploadUrl(apiKey) {
  const response = await fetch(`${VT_API_URL}/files/upload_url`, {
    method: 'GET',
    headers: {
      'x-apikey': apiKey,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || 'VirusTotal upload URL request failed',
    );
    error.code = 'VT_API_ERROR';
    throw error;
  }

  return payload?.data;
}

async function uploadFileForAnalysis(apiKey, file) {
  const formData = new FormData();
  const filename = file.originalname || 'upload.bin';
  const contentType = file.mimetype || 'application/octet-stream';
  const blob = new Blob([file.buffer], { type: contentType });

  formData.append('file', blob, filename);

  const uploadUrl =
    file.size > MAX_INLINE_UPLOAD_BYTES
      ? await getUploadUrl(apiKey)
      : `${VT_API_URL}/files`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'x-apikey': apiKey,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || 'VirusTotal file upload failed',
    );
    error.code = 'VT_API_ERROR';
    throw error;
  }

  const analysisId = payload?.data?.id;
  if (!analysisId) {
    const error = new Error('VirusTotal analysis id not returned');
    error.code = 'VT_API_ERROR';
    throw error;
  }

  return analysisId;
}

async function getAnalysis(apiKey, analysisId) {
  const response = await fetch(`${VT_API_URL}/analyses/${analysisId}`, {
    method: 'GET',
    headers: {
      'x-apikey': apiKey,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || 'VirusTotal analysis request failed',
    );
    error.code = 'VT_API_ERROR';
    throw error;
  }

  return payload;
}

async function waitForAnalysis(apiKey, analysisId) {
  for (let attempt = 0; attempt < ANALYSIS_POLL_RETRIES; attempt += 1) {
    const analysis = await getAnalysis(apiKey, analysisId);
    const status = analysis?.data?.attributes?.status;
    if (status === 'completed') {
      return analysis;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, ANALYSIS_POLL_DELAY_MS),
    );
  }

  const error = new Error('VirusTotal analysis did not complete in time');
  error.code = 'VT_ANALYSIS_PENDING';
  throw error;
}

export const virusTotalService = {
  async revisarArchivo(file) {
    if (!file || !file.buffer) {
      const error = new Error('No file provided for VirusTotal scan');
      error.code = 'VT_INVALID_FILE';
      throw error;
    }

    const apiKey = getApiKey();
    const analysisId = await uploadFileForAnalysis(apiKey, file);
    const analysis = await waitForAnalysis(apiKey, analysisId);

    const stats = analysis?.data?.attributes?.stats || {};
    const malicious = Number(stats.malicious || 0);
    const suspicious = Number(stats.suspicious || 0);

    if (malicious > 0 || suspicious > 0) {
      const error = new Error(
        'El archivo fue marcado como malicioso por VirusTotal.',
      );
      error.code = 'VT_MALICIOUS';
      error.details = stats;
      throw error;
    }

    return {
      stats,
      analysisId,
      status: analysis?.data?.attributes?.status || 'completed',
    };
  },
};
