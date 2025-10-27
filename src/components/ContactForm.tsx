// @ts-nocheck
import { useState, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    serviceType: "",
    message: "",
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState("idle") // 'idle' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("")

  const recaptchaRef = useRef(null)

  const serviceTypes = [
    "Selecciona un tipo de servicio",
    "Piscinero",
    "Control de Plagas",
    "Refrigeración",
    "Áreas Verdes",
    "Otro",
  ]

  // Get environment variables
  const RECAPTCHA_SITE_KEY = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY
  const FIREBASE_FUNCTION_URL = import.meta.env.PUBLIC_FIREBASE_FUNCTION_URL

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "El nombre es requerido"
        if (value.trim().length < 3)
          return "El nombre debe tener al menos 3 caracteres"
        break
      case "email":
        if (!value.trim()) return "El email es requerido"
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return "Email inválido"
        break
      case "phone":
        if (!value.trim()) return "El teléfono es requerido"
        const phoneRegex = /^[\d\s\-\+\(\)]+$/
        if (!phoneRegex.test(value)) return "Teléfono inválido"
        break
      case "company":
        if (!value.trim()) return "La empresa/negocio es requerida"
        break
      case "serviceType":
        if (!value || value === "Selecciona un tipo de servicio") {
          return "Selecciona un tipo de servicio"
        }
        break
      case "message":
        if (!value.trim()) return "El mensaje es requerido"
        if (value.trim().length < 10)
          return "El mensaje debe tener al menos 10 caracteres"
        break
    }
    return undefined
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors((prev) => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all fields
    const newErrors = {}
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key])
      if (error) newErrors[key] = error
    })

    // Mark all fields as touched
    const allTouched = {}
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true
    })
    setTouched(allTouched)

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Get reCAPTCHA token
    const recaptchaToken = recaptchaRef.current?.getValue()

    if (!recaptchaToken) {
      setSubmitStatus("error")
      setErrorMessage("Por favor completa la verificación reCAPTCHA")
      return
    }

    // Submit form
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          serviceType: formData.serviceType,
          message: formData.message,
          recaptchaToken: recaptchaToken,
        }),
      })

      if (response.ok) {
        // Success
        setSubmitStatus("success")
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          serviceType: "",
          message: "",
        })
        setTouched({})
        setErrors({})
        recaptchaRef.current?.reset()

        // Hide success message after 5 seconds
        setTimeout(() => setSubmitStatus("idle"), 5000)
      } else {
        // Error from server
        const errorText = await response.text()
        setSubmitStatus("error")
        setErrorMessage(
          errorText || "Error al enviar el mensaje. Intenta nuevamente."
        )
        recaptchaRef.current?.reset()
      }
    } catch (error) {
      // Network error
      setSubmitStatus("error")
      setErrorMessage(
        "Error de conexión. Por favor verifica tu internet e intenta nuevamente."
      )
      recaptchaRef.current?.reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInputClasses = (fieldName) => {
    const baseClasses =
      "w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
    if (touched[fieldName] && errors[fieldName]) {
      return `${baseClasses} border-red bg-red/5 text-text`
    }
    if (touched[fieldName] && !errors[fieldName] && formData[fieldName]) {
      return `${baseClasses} border-green bg-green/5 text-text`
    }
    return `${baseClasses} border-border bg-primary text-text`
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-text mb-2"
          >
            Nombre completo <span className="text-red">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClasses("name")}
            placeholder="Tu nombre completo"
            disabled={isSubmitting}
          />
          {touched.name && errors.name && (
            <p className="mt-1 text-sm text-red flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-text mb-2"
          >
            Email <span className="text-red">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClasses("email")}
            placeholder="tu@email.com"
            disabled={isSubmitting}
          />
          {touched.email && errors.email && (
            <p className="mt-1 text-sm text-red flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-text mb-2"
          >
            Teléfono <span className="text-red">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClasses("phone")}
            placeholder="+1 (555) 123-4567"
            disabled={isSubmitting}
          />
          {touched.phone && errors.phone && (
            <p className="mt-1 text-sm text-red flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.phone}
            </p>
          )}
        </div>

        {/* Company */}
        <div>
          <label
            htmlFor="company"
            className="block text-sm font-semibold text-text mb-2"
          >
            Empresa/Negocio <span className="text-red">*</span>
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClasses("company")}
            placeholder="Nombre de tu empresa"
            disabled={isSubmitting}
          />
          {touched.company && errors.company && (
            <p className="mt-1 text-sm text-red flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.company}
            </p>
          )}
        </div>

        {/* Service Type */}
        <div>
          <label
            htmlFor="serviceType"
            className="block text-sm font-semibold text-text mb-2"
          >
            Tipo de servicio <span className="text-red">*</span>
          </label>
          <select
            id="serviceType"
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClasses("serviceType")}
            disabled={isSubmitting}
          >
            {serviceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {touched.serviceType && errors.serviceType && (
            <p className="mt-1 text-sm text-red flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.serviceType}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-semibold text-text mb-2"
          >
            Mensaje <span className="text-red">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={5}
            className={getInputClasses("message")}
            placeholder="Cuéntanos sobre tu negocio y cómo podemos ayudarte..."
            disabled={isSubmitting}
          />
          {touched.message && errors.message && (
            <p className="mt-1 text-sm text-red flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.message}
            </p>
          )}
        </div>

        {/* reCAPTCHA */}
        <div className="flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            theme="light"
          />
        </div>

        {/* Success Message */}
        {submitStatus === "success" && (
          <div className="mb-6 p-4 bg-green/10 border-2 border-green rounded-lg animate-fade-in">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-green"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green font-semibold">
                ¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo
                pronto.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === "error" && (
          <div className="mb-6 p-4 bg-red/10 border-2 border-red rounded-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            isSubmitting
              ? "bg-accent/50 text-primary/70 cursor-not-allowed"
              : "bg-accent text-primary hover:opacity-90 hover:shadow-xl hover:scale-105"
          }`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Enviando...
            </>
          ) : (
            <>
              Enviar Mensaje
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
