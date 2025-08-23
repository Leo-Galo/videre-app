// src/app/privacy/page.tsx
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/landing/app-footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="shadow-xl rounded-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl md:text-4xl font-headline text-primary">Política de Privacidad</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none text-foreground/80">
              <p><strong>Última actualización:</strong> 14 de Junio de 2025</p>

              <h2>1. Introducción</h2>
              <p>Bienvenido a Videre ("nosotros", "nuestro", o "Videre"). Estamos comprometidos a proteger tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos tu información cuando visitas nuestro sitio web [TuSitioWeb.com] y utilizas nuestros servicios de software para la gestión de ópticas.</p>
              <p>Por favor, lee esta política de privacidad cuidadosamente. Si no estás de acuerdo con los términos de esta política de privacidad, por favor no accedas al sitio ni utilices nuestros servicios.</p>

              <h2>2. Recopilación de tu Información</h2>
              <p>Podemos recopilar información sobre ti de varias maneras. La información que podemos recopilar a través del Servicio incluye:</p>
              <ul>
                <li><strong>Datos Personales:</strong> Información de identificación personal, como tu nombre, dirección de correo electrónico, número de teléfono, y nombre de la clínica, que nos proporcionas voluntariamente cuando te registras en el Servicio o eliges participar en diversas actividades relacionadas con el Servicio.</li>
                <li><strong>Datos de la Clínica y Pacientes (Procesados en Nombre de la Clínica):</strong> Cuando una clínica utiliza Videre, ingresa información sobre su negocio y sus pacientes (incluyendo datos optométricos, historial clínico, citas, ventas, inventario). Videre actúa como un procesador de datos para esta información. La clínica es la controladora de estos datos.</li>
                <li><strong>Datos Derivados:</strong> Información que nuestros servidores recopilan automáticamente cuando accedes al Servicio, como tu dirección IP, tipo de navegador, sistema operativo, tiempos de acceso y las páginas que has visto directamente antes y después de acceder al Servicio.</li>
                <li><strong>Datos Financieros:</strong> Información financiera, como datos relacionados con tu método de pago (por ejemplo, número de tarjeta de crédito válida, marca de la tarjeta, fecha de caducidad) que podemos recopilar cuando compras, ordenas, devuelves, intercambias o solicitas información sobre nuestros servicios. (Nota: Actualmente, esto es simulado y no recopilamos datos financieros reales).</li>
              </ul>

              <h2>3. Uso de tu Información</h2>
              <p>Tener información precisa sobre ti nos permite proporcionarte una experiencia fluida, eficiente y personalizada. Específicamente, podemos usar la información recopilada sobre ti a través del Servicio para:</p>
              <ul>
                <li>Crear y gestionar tu cuenta.</li>
                <li>Procesar tus transacciones y suscripciones.</li>
                <li>Enviarte correos electrónicos administrativos, de confirmación, técnicos, de actualizaciones y de soporte.</li>
                <li>Mejorar la eficiencia y operación del Servicio.</li>
                <li>Monitorear y analizar el uso y las tendencias para mejorar tu experiencia con el Servicio.</li>
                <li>Notificarte sobre actualizaciones del Servicio.</li>
                <li>Prevenir actividades fraudulentas, monitorear contra robos y proteger contra actividades criminales.</li>
                <li>Cumplir con las obligaciones legales y regulatorias.</li>
              </ul>

              <h2>4. Divulgación de tu Información</h2>
              <p>No compartiremos tu información personal con terceros excepto como se describe en esta Política de Privacidad o con tu consentimiento.</p>
              <p>En el caso de los datos de pacientes ingresados por las clínicas, Videre no utiliza estos datos para sus propios fines y solo los procesa según las instrucciones de la clínica controladora, de acuerdo con nuestros acuerdos de procesamiento de datos y esta política.</p>
              
              <h2>5. Seguridad de tu Información</h2>
              <p>Utilizamos medidas de seguridad administrativas, técnicas y físicas para ayudar a proteger tu información personal y los datos de tus pacientes. Si bien hemos tomado medidas razonables para asegurar la información personal que nos proporcionas, ten en cuenta que a pesar de nuestros esfuerzos, ninguna medida de seguridad es perfecta o impenetrable, y ningún método de transmisión de datos puede garantizarse contra cualquier interceptación u otro tipo de mal uso.</p>
              <p>Utilizamos Firebase Authentication para la gestión de identidades y Firestore con reglas de seguridad para proteger los datos almacenados.</p>

              <h2>6. Política para Niños</h2>
              <p>No solicitamos conscientemente información de ni comercializamos a niños menores de 13 años (o la edad de consentimiento digital en tu jurisdicción). Si te das cuenta de que hemos recopilado información de niños sin el consentimiento parental verificable, por favor contáctanos.</p>

              <h2>7. Cambios a esta Política de Privacidad</h2>
              <p>Podemos actualizar esta Política de Privacidad de vez en cuando. Te notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página y actualizando la fecha de "Última actualización".</p>

              <h2>8. Contáctanos</h2>
              <p>Si tienes preguntas o comentarios sobre esta Política de Privacidad, por favor contáctanos en: info@videre.cr</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
