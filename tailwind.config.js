module.exports = {
  content: [
    "./views/*.{html,js,ejs}",
    "./views/**/*.{html,js,ejs}",
    "./assets/**/*.js",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'sm': '560px'
      },
      fontFamily: {
        "main": "Unbounded",
        "default": "Rubik"
      }
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
