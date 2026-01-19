/**
 * Politica de Privacidad y Tratamiento de Datos (LOPDP)
 */

import { Link } from 'react-router-dom';

export const SteamworksPrivacyPolicyPage = () => {
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
              Politica de Privacidad y Tratamiento de Datos (LOPDP)
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
                1. Responsable del tratamiento
              </h2>
              <p>
                Steam Clone es el responsable del tratamiento de datos del
                Programa de Desarrolladores Steamworks. Contacto:
                privacidad@steamclone.local.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                2. Datos que recolectamos
              </h2>
              <ul className='list-disc list-inside mt-2 space-y-2 text-gray-300'>
                <li>Datos de cuenta: email y credenciales.</li>
                <li>Datos personales: nombre legal, pais, telefono, direccion.</li>
                <li>Datos bancarios y fiscales: banco, cuenta, titular, NIF/CIF.</li>
                <li>Datos de seguridad: IP, user agent y registros de acceso.</li>
              </ul>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                3. Finalidades del tratamiento
              </h2>
              <ul className='list-disc list-inside mt-2 space-y-2 text-gray-300'>
                <li>Crear y gestionar tu cuenta de desarrollador.</li>
                <li>Procesar pagos y obligaciones fiscales.</li>
                <li>Prevenir fraude, mejorar seguridad y auditoria.</li>
                <li>Cumplir obligaciones legales y contractuales.</li>
              </ul>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>4. Base legal</h2>
              <p>
                El tratamiento se basa en tu consentimiento informado (LOPDP),
                la ejecucion del contrato de servicio y el cumplimiento de
                obligaciones legales.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>5. Retencion</h2>
              <p>
                Conservamos los datos mientras la cuenta este activa y hasta 5
                anios posteriores a su cierre para cumplir obligaciones legales,
                fiscales y atender disputas o auditorias. Esta retencion se
                limita a lo estrictamente necesario.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                6. Destinatarios y encargados
              </h2>
              <p>
                Podemos compartir datos con proveedores de hosting, servicios de
                pago y seguridad bajo acuerdos de confidencialidad y solo para
                las finalidades descritas.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                7. Derechos de los titulares
              </h2>
              <p>
                Puedes ejercer derechos de acceso, rectificacion, actualizacion,
                eliminacion, oposicion, portabilidad y revocacion del
                consentimiento escribiendo a privacidad@steamclone.local.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>8. Seguridad</h2>
              <p>
                Aplicamos medidas tecnicas y organizativas para proteger tu
                informacion, incluyendo cifrado y controles de acceso.
              </p>
            </section>

            <section>
              <h2 className='text-white font-semibold mb-2'>
                9. Cambios en la politica
              </h2>
              <p>
                Podemos actualizar esta politica. Las nuevas versiones estaran
                disponibles en esta pagina y aplicaran desde su publicacion.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
