const DEFAULT_PROVIDER = 'Buy Me a Coffee';

function isSafeSupportUrl(value) {
  if (!value) return false;

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export default function () {
  const url = process.env.SUPPORT_URL?.trim() || '';
  const provider = process.env.SUPPORT_PROVIDER?.trim() || DEFAULT_PROVIDER;

  return {
    configured: isSafeSupportUrl(url),
    provider,
    url,
  };
}
