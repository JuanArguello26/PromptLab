# PromptLab

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Groq](https://img.shields.io/badge/AI-Groq%20%2B%20Llama%203.1-FF6B6B?style=flat-square&logo=groq)

---

## 🇪🇸 Español

### Descripción

**PromptLab** es una aplicación web profesional para generar prompts optimizados para IA. Transforma descripciones simples en prompts detallados y estructurados, organizados por categorías para diferentes necesidades.

### Características

- 🎯 **6 Categorías Especializadas**: Estudio, Trabajo, Creativo, Desarrollo, Personal, Marketing
- ⚡ **Generación con IA**: Utiliza Llama 3.1 a través de Groq API (tier gratuito)
- 📋 **Historial Local**: Guarda hasta 20 generaciones recientes en el navegador
- 📋 **Copia con Un Clic**: Copia el prompt generado al portapapeles instantáneamente
- 🔄 **Regenerar**: Genera nuevas variaciones del mismo prompt
- 📱 **Diseño Responsivo**: Funciona perfectamente en móvil y escritorio

### Tech Stack

| Tecnología | Propósito |
|------------|-----------|
| Next.js 16 | Framework React con App Router |
| React 19 | Biblioteca de UI |
| TypeScript 6 | Tipado estático |
| Tailwind CSS | Estilos Utility-first |
| Groq AI | API de IA con modelo Llama 3.1 |

### Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/JuanArguello26/PromptLab.git
cd PromptLab

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local y añadir tu GROQ_API_KEY

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000) para ver la aplicación.

### Configuración

#### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
GROQ_API_KEY=tu-api-key-aqui
```

Obtén tu API key gratuita en [console.groq.com](https://console.groq.com/keys)

### API Reference

#### Endpoint de Generación

```
POST /api/generate
```

**Body (JSON):**
```json
{
  "category": "estudio" | "trabajo" | "creativo" | "desarrollo" | "personal" | "marketing",
  "description": "Tu descripción del prompt..."
}
```

**Respuesta:**
```json
{
  "prompt": "El prompt generado profesionalmente..."
}
```

### Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🇺🇸 English

### Description

**PromptLab** is a professional web application for generating optimized AI prompts. It transforms simple descriptions into detailed, well-structured prompts organized by categories for different needs.

### Features

- 🎯 **6 Specialized Categories**: Study, Work, Creative, Development, Personal, Marketing
- ⚡ **AI Generation**: Powered by Llama 3.1 via Groq API (free tier)
- 📋 **Local History**: Saves up to 20 recent generations in the browser
- 📋 **One-Click Copy**: Copy generated prompts to clipboard instantly
- 🔄 **Regenerate**: Generate new variations of the same prompt
- 📱 **Responsive Design**: Works perfectly on mobile and desktop

### Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | React Framework with App Router |
| React 19 | UI Library |
| TypeScript 6 | Static Typing |
| Tailwind CSS | Utility-first Styles |
| Groq AI | AI API with Llama 3.1 model |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/JuanArguello26/PromptLab.git
cd PromptLab

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your GROQ_API_KEY

# 4. Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Configuration

#### Environment Variables

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=your-api-key-here
```

Get your free API key at [console.groq.com](https://console.groq.com/keys)

### API Reference

#### Generation Endpoint

```
POST /api/generate
```

**Body (JSON):**
```json
{
  "category": "estudio" | "trabajo" | "creativo" | "desarrollo" | "personal" | "marketing",
  "description": "Your prompt description..."
}
```

**Response:**
```json
{
  "prompt": "The professionally generated prompt..."
}
```

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

¡Contribuciones, issues y feature requests son bienvenidos! / Contributions, issues and feature requests are welcome!

---

Hecho con ❤️ por [@JuanArguello26](https://github.com/JuanArguello26)
