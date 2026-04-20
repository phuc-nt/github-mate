const FRAMEWORK_PATTERNS: Record<string, RegExp> = {
  React: /\b(react|reactjs|react-native)\b/i,
  Vue: /\b(vue|vuejs|nuxt)\b/i,
  Svelte: /\b(svelte|sveltekit)\b/i,
  NextJS: /\b(next\.?js|nextjs)\b/i,
  FastAPI: /\bfastapi\b/i,
  Django: /\bdjango\b/i,
  Flask: /\bflask\b/i,
  Express: /\bexpress(?:js)?\b/i,
  TensorFlow: /\btensorflow\b/i,
  PyTorch: /\bpytorch\b/i,
  Kubernetes: /\b(kubernetes|k8s)\b/i,
  Docker: /\bdocker\b/i,
};

export function detectFrameworks(text: string): string[] {
  const found = new Set<string>();
  for (const [name, re] of Object.entries(FRAMEWORK_PATTERNS)) {
    if (re.test(text)) found.add(name);
  }
  return Array.from(found);
}
