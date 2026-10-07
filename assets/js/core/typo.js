// Typographie française : espaces insécables avant : ; ? ! et à l'intérieur des guillemets.
export function fr(text) {
  return String(text ?? '')
    .replace(/«\s*/g, '« ')
    .replace(/\s*»/g, ' »')
    .replace(/\s+([:;?!])/g, ' $1');
}
