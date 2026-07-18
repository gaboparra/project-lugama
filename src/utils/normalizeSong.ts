export const normalizeText = (text = "") => {
  return (
    text.toLowerCase()
      // elimina (Live), (Remastered), etc
      .replace(/\(.*\)|\[.*\]/g, "")
      // elimina " - Live"
      .split("-")[0]
      // elimina acentos
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  );
};
