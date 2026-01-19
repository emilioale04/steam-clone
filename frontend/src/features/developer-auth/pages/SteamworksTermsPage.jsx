/**
 * Terminos y Condiciones - Programa de Desarrolladores (Steamworks)
 */

import { Link } from 'react-router-dom';

export const SteamworksTermsPage = () => {
  return (
    <div className='min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]'>
          <div className='flex flex-col gap-3 mb-6'>
            <Link
              to='/steamworks/registro'
              className='text-[#66c0f4] text-sm hover:underline'
            >
              Volver al registro
            </Link>
            <h1 className='text-2xl font-bold text-white'>
              Terminos y Condiciones del Programa de Desarrolladores
            </h1>
            <p className='text-gray-400 text-sm'>Version 1.0 - 19/01/2026</p>
            <div className='flex flex-wrap gap-3 text-xs text-gray-400'>
              <Link
                to='/steamworks/terminos'
                className='hover:text-[#66c0f4]'
              >
                Terminos
              </Link>
              <Link
                to='/steamworks/acuerdo-distribucion'
                className='hover:text-[#66c0f4]'
              >
                Acuerdo de Distribucion
              </Link>
              <Link
                to='/steamworks/politicas-contenido'
                className='hover:text-[#66c0f4]'
              >
                Politicas de Contenido
              </Link>
              <Link
                to='/steamworks/privacidad'
                className='hover:text-[#66c0f4]'
              >
                Politica de Privacidad
              </Link>
            </div>
          </div>

          <div className='space-y-6 text-gray-200 text-sm leading-relaxed'>
            <section>
              <h2 className='text-white font-semibold mb-2'>
                1. Aceptacion y alcance
              </h2>
              <p>
                Al registrarte y usar Steamworks, aceptas estos Terminos y
                Condiciones, el Acuerdo de Distribucion, las Politicas de
                Contenido y la Politica de Privacidad. Si no estas de acuerdo,
                no completes el registro ni uses la plataforma.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                2. Cuenta y seguridad
              </h2>
              <p>
                Eres responsable de la confidencialidad de tus credenciales y
                de toda actividad en tu cuenta. Debes notificar cualquier uso
                no autorizado o incidente de seguridad.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                3. Informacion proporcionada
              </h2>
              <p>
                Debes proporcionar informacion veraz, completa y actualizada.
                Algunos datos (personales, bancarios y fiscales) son necesarios
                para gestionar pagos, validaciones y cumplimiento legal.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                4. Contenido y cumplimiento
              </h2>
              <p>
                Tu contenido debe cumplir las Politicas de Contenido y la ley
                aplicable. Eres responsable de contar con los derechos y
                licencias necesarias sobre el material que publiques.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                5. Pagos y facturacion
              </h2>
              <p>
                Para recibir pagos debes registrar informacion bancaria
                valida. Podemos requerir documentacion adicional para
                verificacion y cumplimiento de obligaciones fiscales.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                6. Propiedad intelectual
              </h2>
              <p>
                Conservas la titularidad de tu contenido. Nos otorgas una
                licencia no exclusiva para alojar, distribuir y mostrar tu
                contenido dentro de la plataforma, segun el Acuerdo de
                Distribucion.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                7. Suspensiones y terminacion
              </h2>
              <p>
                Podemos suspender o terminar tu cuenta por incumplimiento de
                estos terminos, las politicas aplicables o por riesgos de
                seguridad o fraude.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                8. Cambios en los terminos
              </h2>
              <p>
                Podemos actualizar estos terminos para reflejar cambios legales
                o del servicio. La continuidad en el uso del sistema implica
                aceptacion de las nuevas versiones.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>9. Contacto</h2>
              <p>
                Para consultas legales o de soporte escribe a
                soporte@steamclone.local.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
