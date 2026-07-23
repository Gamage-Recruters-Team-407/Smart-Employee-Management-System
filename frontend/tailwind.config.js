/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/context/**/*.{js,ts,jsx,tsx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Mobile responsive
    'lg:hidden',
    'lg:static',
    'lg:translate-x-0',
    'lg:block',
    'lg:flex',
    'lg:inline-flex',
    'lg:grid',
    'lg:inline-grid',
    'lg:relative',
    
    // Transform
    '-translate-x-full',
    'translate-x-0',
    
    // Position
    'fixed',
    'relative',
    'absolute',
    'static',
    'inset-0',
    'inset-y-0',
    'left-0',
    
    // Display
    'hidden',
    'block',
    'flex',
    'inline-flex',
    
    // Z-index
    'z-40',
    'z-50',
    
    // Animation
    'transform',
    'transition-transform',
    'duration-300',
    'ease-in-out',
    
    // Background
    'bg-black/50',
    'bg-white',
    'bg-indigo-50',
    'bg-gray-50',
    'bg-red-500',
    'bg-indigo-600',
    
    // Text
    'text-indigo-600',
    'text-gray-700',
    'text-gray-800',
    'text-white',
    'text-[10px]',
    
    // Layout
    'h-screen',
    'w-64',
    'w-10',
    'h-10',
    'min-h-screen',
    'flex-shrink-0',
    'flex-1',
    'space-y-1',
    
    // Padding & Margin
    'p-6',
    'p-2',
    'px-4',
    'py-3',
    'px-1.5',
    'py-0.5',
    'mb-6',
    'mb-10',
    'ml-auto',
    
    // Border & Shadow
    'border-r',
    'border-t-transparent',
    'shadow-xl',
    'rounded-2xl',
    'rounded-xl',
    'rounded-full',
    
    // Font
    'font-bold',
    'font-medium',
    'text-2xl',
    'text-3xl',
    
    // Flex
    'items-center',
    'justify-center',
    'justify-end',
    'gap-3',
    
    // Truncate
    'truncate',
    
    // Animation
    'animate-spin',
    
    // Hover
    'hover:bg-gray-50',
    'transition-colors',
    'transition-all',
    'duration-200',
    
    // Group
    'group',
    
    // Others
    'flex-shrink-0',
    'overflow-hidden',
  ],
  theme: {
    extend: {
      screens: {
        'lg': '1024px',
        'md': '768px',
        'sm': '640px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}