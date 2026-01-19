/**
 * Politicas de Contenido - Steamworks
 */

import { Link } from 'react-router-dom';

export const SteamworksContentPolicyPage = () => {
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
              Politicas de Contenido
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
                1. Contenido prohibido
              </h2>
              <p>No se permite contenido que:</p>
              <ul className='list-disc list-inside mt-2 space-y-2 text-gray-300'>
                <li>Contenga malware, exploits o codigo malicioso.</li>
                <li>Infrinja derechos de autor, marcas o patentes.</li>
                <li>Promueva violencia extrema, odio o discriminacion.</li>
                <li>Incluya acoso, doxing o amenazas creibles.</li>
                <li>Facilite actividades ilegales o fraude.</li>
              </ul>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                2. Contenido sensible
              </h2>
              <p>
                El contenido para adultos debe estar correctamente etiquetado y
                cumplir leyes aplicables del pais de destino. Nos reservamos el
                derecho de restringir o retirar contenido que incumpla estas
                normas.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                3. Seguridad del usuario
              </h2>
              <p>
                No se permite recopilar datos de usuarios finales sin aviso ni
                consentimiento. Las funcionalidades online deben cumplir
                estandares de seguridad y privacidad.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                4. Medidas de enforcement
              </h2>
              <p>
                El incumplimiento puede resultar en retiro del contenido,
                suspension de funcionalidades o terminacion del acceso a
                Steamworks.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
