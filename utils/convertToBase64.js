const convertToBase64 = (file) => {
  if (file) {
    return `data:${file.mimetype};base64,${file.data.toString('base64')}`;
  }
  return null;
};
module.exports = convertToBase64;



// const convertToBase64 = (file) => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file.data); // Assurez-vous que `file.data` est l'image
//     reader.onload = () => resolve(reader.result);
//     reader.onerror = (error) => reject(error);
//   });
// };
