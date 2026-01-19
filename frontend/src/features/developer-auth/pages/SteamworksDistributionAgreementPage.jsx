/**
 * Acuerdo de Distribucion - Steamworks
 */

import { Link } from 'react-router-dom';

export const SteamworksDistributionAgreementPage = () => {
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
              Acuerdo de Distribucion de Steamworks
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
              <h2 className='text-white font-semibold mb-2'>1. Licencia</h2>
              <p>
                Nos otorgas una licencia no exclusiva, mundial y revocable para
                alojar, distribuir, mostrar, promocionar y vender tu contenido
                dentro de Steamworks y sus canales asociados.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                2. Obligaciones del desarrollador
              </h2>
              <p>
                Garantizas que tienes todos los derechos necesarios sobre el
                contenido, que no infringe derechos de terceros y que cumple
                con las Politicas de Contenido y la ley aplicable.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                3. Precios, pagos y comisiones
              </h2>
              <p>
                El esquema de precios, comisiones y fechas de pago se detalla
                en el panel de Steamworks y puede actualizarse conforme a las
                condiciones del servicio. Los pagos pueden estar sujetos a
                retenciones legales o verificaciones antifraude.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>4. Impuestos</h2>
              <p>
                Eres responsable de cumplir con tus obligaciones fiscales. Nos
                autorizas a solicitar documentacion para cumplir con requisitos
                tributarios o regulatorios.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                5. Garantias e indemnidad
              </h2>
              <p>
                Aceptas indemnizar por reclamaciones derivadas del contenido
                que distribuyes o de incumplimientos legales asociados.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                6. Terminacion del acuerdo
              </h2>
              <p>
                Podemos terminar este acuerdo por incumplimientos, riesgos de
                seguridad o decisiones legales. Al terminar, podremos retirar
                el contenido de la tienda y cerrar accesos a herramientas
                internas.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
