const backgrounds = [
  "../images/backgrounds/pixelForestBg.png",
  "../images/backgrounds/desert.jpg",
  "../images/backgrounds/escape-desert.webp",
  "../images/backgrounds/spring.jpg",
  "../images/backgrounds/fall.jpg",
  "../images/backgrounds/snow.jpg",
  "../images/backgrounds/city.jpg",
  "../images/backgrounds/raining-city.png",
  "../images/backgrounds/night-sky.jpg",
    "../images/backgrounds/sunset.jpg",
];

let current = 0;

setInterval(() => {
  current = (current + 1) % backgrounds.length;
  document.body.style.setProperty(
    "--bg-image",
    `url("${backgrounds[current]}")`
  );
  document.body.style.backgroundImage = `url("${backgrounds[current]}")`;
  document.querySelector("body")?.style.setProperty(
    "--bg-image",
    `url("${backgrounds[current]}")`
  );

  // Update the ::before pseudo-element
  document.body.style.setProperty(
    "--before-bg",
    `url("${backgrounds[current]}")`
  );
  document.querySelector("body").style.setProperty(
    "--before-bg",
    `url("${backgrounds[current]}")`
  );
}, 15000); // change every 5 seconds
