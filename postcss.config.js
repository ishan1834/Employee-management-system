// ==========================================================
//                POSTCSS CONFIGURATION FILE
// ==========================================================

// Import required plugins


const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

// Optional plugins for extended functionality


const postcssNested = require('postcss-nested');
const postcssImport = require('postcss-import');
const postcssMixins = require('postcss-mixins');
const postcssVariables = require('postcss-simple-vars');
const postcssPresetEnv = require('postcss-preset-env');
const cssnano = require('cssnano');



// ==========================================================


//                ENVIRONMENT DETECTION


// ==========================================================



const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;



// ==========================================================


//                BASE PLUGINS CONFIG


// ==========================================================



const basePlugins = {
  tailwindcss: {},
  autoprefixer: {},
};



// ==========================================================


//                ADVANCED PLUGINS CONFIG


// ==========================================================



const advancedPlugins = [
  postcssImport(),
  postcssMixins(),
  postcssVariables({
    variables: {
      primaryColor: '#3b82f6',
      secondaryColor: '#7c3aed',
      accentColor: '#38bdf8',
    },
  }),


  
  postcssNested(),
  postcssPresetEnv({
    stage: 1,
    features: {
      'nesting-rules': true,
    },
  }),
];




// ==========================================================



//                PRODUCTION OPTIMIZATION



// ==========================================================




const productionPlugins = isProduction
  ? [
      cssnano({
        preset: 'default',
      }),
    ]
  : [];

// ==========================================================
//                CUSTOM DEBUG LOGGER
// ==========================================================

function debugLogger() {
  return {
    postcssPlugin: 'debug-logger',
    Once(root) {
      if (isDevelopment) {
        console.log('✅ PostCSS is running in DEVELOPMENT mode');
      } else {
        console.log('🚀 PostCSS is running in PRODUCTION mode');
      }
    },
  };
}
debugLogger.postcss = true;




// ==========================================================



//                FINAL EXPORT CONFIG



// ==========================================================




module.exports = {
  plugins: [
    // Core Plugins
    postcssImport(),
    tailwindcss(),
    autoprefixer(),

    // Extended Features
    ...advancedPlugins,

    // Debug Plugin
    debugLogger(),

    // Production Optimization
    ...productionPlugins,
  ],
};




// ==========================================================



//                EXTRA NOTES (FOR SCALABILITY)



// ==========================================================




/*
  This configuration supports:

  ✔ TailwindCSS utility-first styling
  ✔ Automatic vendor prefixing
  ✔ Nested CSS (like SCSS)
  ✔ Variables and mixins
  ✔ Future CSS features via preset-env
  ✔ Production minification (cssnano)
  ✔ Debug logs for environment tracking

  You can extend further by adding:

  - postcss-rtl (for RTL languages)
  - purgecss (for unused CSS removal)
  - stylelint (for linting)
  - postcss-custom-media (for responsive media queries)

  This file is structured for:
  → scalability
  → readability
  → real-world production apps
*/




// ==========================================================



//                OPTIONAL EXTENSIONS



// ==========================================================




// Example: Adding future plugins dynamically
function loadOptionalPlugins() {
  const optional = [];

  if (isProduction) {
    // Example placeholder for additional prod tools
    // optional.push(require('postcss-discard-comments')());
  }



  
  return optional;
}




// Merge optional plugins
module.exports.plugins.push(...loadOptionalPlugins());




// ==========================================================



//                END OF CONFIG



// ==========================================================
