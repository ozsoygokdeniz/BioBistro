export const getMealImage = (imageUrl) => {
  if (!imageUrl) return require('../assets/images/1.png');

  // URL'den sadece dosya adını al (örn: "/meal-images/12.png" -> "12.png")
  const filename = imageUrl.split('/').pop();

  switch (filename) {
    case '1.png': return require('../assets/images/1.png');
    case '2.png': return require('../assets/images/2.png');
    case '3.png': return require('../assets/images/3.png');
    case '4.png': return require('../assets/images/4.png');
    case '5.png': return require('../assets/images/5.png');
    case '6.png': return require('../assets/images/6.png');
    case '7.png': return require('../assets/images/7.png');
    case '8.png': return require('../assets/images/8.png');
    case '9.png': return require('../assets/images/9.png');
    case '10.png': return require('../assets/images/10.png');
    case '11.png': return require('../assets/images/11.png');
    case '12.png': return require('../assets/images/12.png');
    case '13.png': return require('../assets/images/13.png');
    case '14.png': return require('../assets/images/14.png');
    case '15.png': return require('../assets/images/15.png');
    case '16.png': return require('../assets/images/16.png');
    case '17.png': return require('../assets/images/17.png');
    case '18.png': return require('../assets/images/18.png');
    case '19.png': return require('../assets/images/19.png');
    case '20.png': return require('../assets/images/20.png');
    case '21.png': return require('../assets/images/21.png');
    case '22.png': return require('../assets/images/22.png');
    case '23.png': return require('../assets/images/23.png');
    case '24.png': return require('../assets/images/24.png');
    case '25.png': return require('../assets/images/25.png');
    case '26.png': return require('../assets/images/26.png');
    case '27.png': return require('../assets/images/27.png');
    case '28.png': return require('../assets/images/28.png');
    case '29.png': return require('../assets/images/29.png');
    case '30.png': return require('../assets/images/30.png');
    case '31.png': return require('../assets/images/31.png');
    case '32.png': return require('../assets/images/32.png');
    case '33.png': return require('../assets/images/33.png');
    case '34.png': return require('../assets/images/34.png');
    case '35.png': return require('../assets/images/35.png');
    case '36.png': return require('../assets/images/36.png');
    case '37.png': return require('../assets/images/37.png');
    case '38.png': return require('../assets/images/38.png');
    case '39.png': return require('../assets/images/39.png');
    case '40.png': return require('../assets/images/40.png');
    default: return require('../assets/images/1.png');
  }
};
