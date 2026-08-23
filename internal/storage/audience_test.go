package storage

import (
	"strings"
	"testing"
)

func TestFilterContentForAudience_Asciidoc(t *testing.T) {
	masterDoc := `= Sesión 1: El Sacramento del Bautismo
:author: P. Francisco

== 📖 Introducción
El Bautismo nos hace hijos de Dios.

[INSTRUCTOR]
.👨‍🏫 Notas Didácticas y Tiempos
====
* Dedicar 10 minutos a la dinámica inicial con una vela encendida.
* Solución a la pregunta 2: El agua simboliza la purificación.
====

== 💡 Desarrollo Principal
La gracia santificante borra el pecado original.

[STUDENT]
.✍️ Actividad del Alumno
====
1. Dibuja el símbolo del agua bautismal.
2. ¿Por qué es importante el Bautismo?
====

[WORKSHOP]
.🛠️ Taller Práctico Grupal
====
Simulación del rito bautismal con los niños en el baptisterio.
====
`

	// 1. Vista Instructor: debe conservar TODO
	instructorView := FilterContentForAudience(masterDoc, "instructor")
	if !strings.Contains(instructorView, "Notas Didácticas y Tiempos") {
		t.Errorf("La vista de instructor debería contener las notas de profesor")
	}
	if !strings.Contains(instructorView, "Actividad del Alumno") {
		t.Errorf("La vista de instructor debería contener las actividades del alumno")
	}

	// 2. Vista Alumno: debe ocultar las notas de profesor pero conservar el desarrollo y actividades
	studentView := FilterContentForAudience(masterDoc, "student")
	if strings.Contains(studentView, "Notas Didácticas y Tiempos") || strings.Contains(studentView, "Solución a la pregunta 2") {
		t.Errorf("La vista de alumno NO debe contener notas ni soluciones del profesor: %s", studentView)
	}
	if !strings.Contains(studentView, "El Bautismo nos hace hijos de Dios") {
		t.Errorf("La vista de alumno debe conservar el contenido general")
	}
	if !strings.Contains(studentView, "Actividad del Alumno") {
		t.Errorf("La vista de alumno debe conservar las fichas de estudiante")
	}
}

func TestFilterContentForAudience_HTML(t *testing.T) {
	htmlMaster := `<p>Introducción a la clase.</p>
<div class="admonition-block admonition-instructor" data-admonition="instructor">
<div class="admonition-header">Notas del Profesor</div>
<div class="admonition-body"><p>Solución del ejercicio: 42.</p></div>
</div>
<p>Texto común a todos los lectores.</p>
<div class="admonition-block admonition-student" data-admonition="student">
<div class="admonition-header">Pregunta del Alumno</div>
<div class="admonition-body"><p>¿Cuánto es 21 * 2?</p></div>
</div>`

	// Vista Alumno en HTML
	studentHtml := FilterContentForAudience(htmlMaster, "student")
	if strings.Contains(studentHtml, "Solución del ejercicio") || strings.Contains(studentHtml, "admonition-instructor") {
		t.Errorf("El HTML filtrado para el alumno contiene bloques de instructor: %s", studentHtml)
	}
	if !strings.Contains(studentHtml, "Pregunta del Alumno") || !strings.Contains(studentHtml, "Texto común") {
		t.Errorf("El HTML filtrado para el alumno debe conservar las preguntas y el texto común: %s", studentHtml)
	}
}

func TestDeriveStudentWorksheet(t *testing.T) {
	masterDoc := `= Los Diez Mandamientos
[INSTRUCTOR]
.Notas
====
Tiempo estimado: 45 min.
====
== Desarrollo
Amar a Dios sobre todas las cosas y al prójimo como a ti mismo.`

	worksheet := DeriveStudentWorksheet(masterDoc, "Los Diez Mandamientos")
	if !strings.Contains(worksheet, "Ficha del Alumno: Los Diez Mandamientos") {
		t.Errorf("Título de ficha de alumno incorrecto: %s", worksheet)
	}
	if strings.Contains(worksheet, "Tiempo estimado: 45 min") {
		t.Errorf("La ficha de alumno no debe arrastrar notas privadas del profesor")
	}
	if !strings.Contains(worksheet, "Preguntas de Comprensión") {
		t.Errorf("La ficha debe contener la sección de preguntas")
	}
}
