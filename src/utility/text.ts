export const cleanUpText = (text: string): string => {
  return text.normalize('NFKC').replace(/\s/g,'');
}