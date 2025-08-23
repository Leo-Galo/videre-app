// src/app/terms/page.tsx
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/landing/app-footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="shadow-xl rounded-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl md:text-4xl font-headline text-primary">Términos de Servicio</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none text-foreground/80">
              <p><strong>Última actualización:</strong> 14 de Junio de 2025</p>

              <h2>1. Aceptación de los Términos</h2>
              <p>Al acceder y utilizar el software Videre ("Servicio"), usted ("Usuario" o "Clínica") acepta estar sujeto a estos Términos de Servicio ("Términos"). Si no está de acuerdo con alguna parte de los términos, no podrá acceder al Servicio.</p>

              <h2>2. Descripción del Servicio</h2>
              <p>Videre proporciona un software de gestión para ópticas que incluye, entre otras, funcionalidades para la gestión de pacientes, inventario, citas, ventas, facturación electrónica y reportes. El Servicio se ofrece bajo diferentes planes de suscripción.</p>

              <h2>3. Cuentas y Registro</h2>
              <p>Para utilizar el Servicio, la Clínica debe registrarse y crear una cuenta. La Clínica es responsable de mantener la confidencialidad de su información de cuenta, incluyendo la contraseña, y de todas las actividades que ocurran bajo su cuenta. La Clínica se compromete a notificar a Videre inmediatamente sobre cualquier uso no autorizado de su cuenta.</p>
              <p>La Clínica es responsable de asegurar que todos los usuarios que accedan al Servicio bajo su cuenta cumplan con estos Términos.</p>

              <h2>4. Planes de Suscripción y Pagos</h2>
              <p>El Servicio se ofrece bajo varios planes de suscripción. Las tarifas, características y duración de cada plan se describen en nuestra página de precios. Las tarifas están sujetas a cambios con previo aviso. Todos los pagos se procesarán a través de nuestra pasarela de pago designada (actualmente simulado).</p>
              <p><strong>Período de Prueba Gratuito:</strong> Ofrecemos un período de prueba gratuito (actualmente de 3 días) para que las nuevas Clínicas puedan evaluar completamente el Servicio antes de comprometerse con un plan de pago. Durante el período de prueba, ciertas funcionalidades podrían estar limitadas. No se requiere información de pago para iniciar el período de prueba.</p>
              <p><strong>Renovaciones:</strong> Las suscripciones de pago se renuevan automáticamente al final de cada ciclo de facturación (mensual o anual, según lo seleccionado), a menos que se cancelen antes de la fecha de renovación. Es responsabilidad de la Clínica gestionar su suscripción y cancelarla si no desea renovar.</p>
              <p><strong>Política de No Reembolso:</strong> Dada la naturaleza del servicio digital y la disponibilidad de un período de prueba gratuito para evaluar el software, Videre opera bajo una estricta política de no reembolso. Una vez que se ha procesado un pago por un período de suscripción (mensual o anual), no se realizarán reembolsos, ni totales ni parciales, por el tiempo no utilizado en caso de cancelación anticipada o por cualquier otro motivo. El período de prueba está diseñado para permitir a los usuarios determinar si el Servicio se ajusta a sus necesidades antes de realizar un pago.</p>
              <p><strong>Cambio de Planes:</strong> Las Clínicas pueden cambiar entre planes de suscripción. Si se realiza un upgrade (cambio a un plan superior), se podría prorratear el costo. Si se realiza un downgrade (cambio a un plan inferior), el cambio tomará efecto al inicio del siguiente ciclo de facturación; no se otorgan reembolsos por la diferencia de precio del período actual.</p>
              <p><strong>Cancelación:</strong> La Clínica puede cancelar su suscripción en cualquier momento desde el panel de gestión de suscripción. La cancelación detendrá las renovaciones automáticas futuras. El acceso al Servicio continuará hasta el final del período de facturación ya pagado.</p>


              <h2>5. Uso Aceptable</h2>
              <p>La Clínica se compromete a no utilizar el Servicio para ningún propósito ilegal o prohibido por estos Términos. La Clínica no debe:</p>
              <ul>
                <li>Intentar obtener acceso no autorizado a los sistemas o redes de Videre.</li>
                <li>Interferir o interrumpir la integridad o el rendimiento del Servicio.</li>
                <li>Utilizar el Servicio para transmitir cualquier material que sea ilegal, acosador, difamatorio, abusivo, amenazante, dañino, vulgar, obsceno o de otro modo objetable.</li>
                <li>Violar las leyes de protección de datos aplicables, incluyendo la obtención de consentimientos necesarios de los pacientes para el procesamiento de sus datos personales.</li>
              </ul>

              <h2>6. Propiedad Intelectual</h2>
              <p>Videre y sus licenciantes poseen todos los derechos, títulos e intereses sobre el Servicio, incluyendo todo el software, contenido (excluyendo los datos de la Clínica), y la marca Videre. Estos Términos no otorgan a la Clínica ningún derecho de propiedad intelectual sobre el Servicio.</p>
              <p>La Clínica retiene la propiedad de todos los datos que ingresa en el Servicio ("Datos de la Clínica"). La Clínica otorga a Videre una licencia limitada para usar, modificar, reproducir y distribuir los Datos de la Clínica únicamente con el propósito de proporcionar y mejorar el Servicio.</p>

              <h2>7. Confidencialidad y Protección de Datos</h2>
              <p>Videre se compromete a proteger la confidencialidad de los Datos de la Clínica de acuerdo con nuestra Política de Privacidad y las leyes aplicables. Implementamos medidas de seguridad razonables para proteger los datos, pero no podemos garantizar una seguridad absoluta.</p>
              <p>La Clínica es responsable de cumplir con todas las leyes de protección de datos aplicables con respecto a los datos personales de sus pacientes que ingresa en el Servicio, incluyendo, pero no limitado a, la obtención de los consentimientos necesarios.</p>

              <h2>8. Terminación</h2>
              <p>Videre puede suspender o terminar el acceso de la Clínica al Servicio si la Clínica incumple estos Términos. La Clínica puede cancelar su suscripción en cualquier momento según los términos de su plan.</p>
              <p>Tras la terminación, Videre puede, a su discreción, permitir a la Clínica exportar sus Datos de la Clínica durante un período limitado. Después de este período, Videre puede eliminar los Datos de la Clínica.</p>

              <h2>9. Limitación de Responsabilidad</h2>
              <p>En la máxima medida permitida por la ley aplicable, Videre no será responsable de ningún daño indirecto, incidental, especial, consecuente o punitivo, o cualquier pérdida de beneficios o ingresos, ya sea incurrida directa o indirectamente, o cualquier pérdida de datos, uso, buena voluntad u otras pérdidas intangibles, resultantes de (a) su acceso o uso o incapacidad para acceder o usar el servicio; (b) cualquier conducta o contenido de cualquier tercero en el servicio.</p>

              <h2>10. Cambios a los Términos</h2>
              <p>Videre se reserva el derecho de modificar estos Términos en cualquier momento. Notificaremos a las Clínicas sobre cambios significativos. El uso continuado del Servicio después de tales cambios constituirá la aceptación de los nuevos Términos.</p>

              <h2>11. Ley Aplicable</h2>
              <p>Estos Términos se regirán e interpretarán de acuerdo con las leyes de Costa Rica, sin tener en cuenta sus disposiciones sobre conflicto de leyes.</p>

              <h2>12. Contacto</h2>
              <p>Si tienes alguna pregunta sobre estos Términos, por favor contáctanos en: info@videre.cr</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
