/// <reference types="vite/client" />
// Define *.glsl files as default strings
declare module '*.glsl' {
  const content: string
  export default content
}
