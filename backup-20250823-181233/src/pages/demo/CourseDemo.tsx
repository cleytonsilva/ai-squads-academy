import React from 'react';
import CourseViewer from '@/components/course/CourseViewer';
import { Course, Module } from '@/types/course';

// Mock data para demonstração
const mockCourse: Course = {
  id: 'demo-course-1',
  title: 'Introdução ao React',
  description: 'Aprenda os fundamentos do React de forma prática e interativa.',
  difficulty_level: 'beginner',
  estimated_duration: 120,
  status: 'published',
  ai_generated: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  modules: [
    {
      id: 'module-1',
      course_id: 'demo-course-1',
      title: 'Conceitos Básicos',
      description: 'Entenda os conceitos fundamentais do React',
      module_type: 'lesson',
      order_index: 0,
      estimated_duration: 30,
      content_jsonb: {
        content: `
          <h2>Bem-vindo ao React!</h2>
          <p>React é uma biblioteca JavaScript para construir interfaces de usuário. Neste módulo, você aprenderá:</p>
          <ul>
            <li>O que é React e por que usá-lo</li>
            <li>Componentes e JSX</li>
            <li>Props e State</li>
            <li>Eventos em React</li>
          </ul>
          <h3>O que é React?</h3>
          <p>React é uma biblioteca JavaScript desenvolvida pelo Facebook para criar interfaces de usuário interativas e dinâmicas.</p>
          <blockquote>
            <p>"React torna a criação de UIs interativas uma tarefa fácil."</p>
          </blockquote>
        `,
        summary: 'Introdução aos conceitos básicos do React'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      quizzes: [
        {
          id: 'quiz-1',
          module_id: 'module-1',
          title: 'Quiz: Conceitos Básicos',
          description: 'Teste seus conhecimentos sobre os conceitos básicos do React',
          questions: [
            {
              id: 'q1',
              question_text: 'O que é React?',
              question_type: 'multiple_choice',
              options: [
                'Uma linguagem de programação',
                'Uma biblioteca JavaScript',
                'Um framework CSS',
                'Um banco de dados'
              ],
              correct_answer: 'Uma biblioteca JavaScript',
              points: 10,
              explanation: 'React é uma biblioteca JavaScript para construir interfaces de usuário.'
            },
            {
              id: 'q2',
              question_text: 'JSX é uma extensão de sintaxe para JavaScript.',
              question_type: 'true_false',
              correct_answer: true,
              points: 5,
              explanation: 'JSX é uma extensão de sintaxe que permite escrever HTML dentro do JavaScript.'
            }
          ],
          time_limit_minutes: 10,
          passing_score: 70,
          xp_reward: 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    },
    {
      id: 'module-2',
      course_id: 'demo-course-1',
      title: 'Componentes e Props',
      description: 'Aprenda a criar e usar componentes React',
      module_type: 'lesson',
      order_index: 1,
      estimated_duration: 45,
      content_jsonb: {
        content: `
          <h2>Componentes React</h2>
          <p>Componentes são os blocos de construção fundamentais do React. Eles permitem dividir a UI em partes independentes e reutilizáveis.</p>
          
          <h3>Tipos de Componentes</h3>
          <p>Existem dois tipos principais de componentes:</p>
          <ul>
            <li><strong>Componentes Funcionais:</strong> Funções que retornam JSX</li>
            <li><strong>Componentes de Classe:</strong> Classes que estendem React.Component</li>
          </ul>
          
          <h3>Props</h3>
          <p>Props (propriedades) são argumentos passados para componentes React. Elas são somente leitura e ajudam a tornar os componentes reutilizáveis.</p>
          
          <pre><code>function Welcome(props) {
  return &lt;h1&gt;Olá, {props.name}!&lt;/h1&gt;;
}</code></pre>
        `,
        summary: 'Aprenda sobre componentes React e como usar props'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      quizzes: []
    },
    {
      id: 'module-3',
      course_id: 'demo-course-1',
      title: 'Estado e Eventos',
      description: 'Entenda como gerenciar estado e eventos em React',
      module_type: 'exercise',
      order_index: 2,
      estimated_duration: 45,
      content_jsonb: {
        content: `
          <h2>Estado em React</h2>
          <p>O estado (state) é um objeto que determina como um componente renderiza e se comporta. Ao contrário das props, o estado é mutável.</p>
          
          <h3>useState Hook</h3>
          <p>O hook useState permite adicionar estado a componentes funcionais:</p>
          
          <pre><code>import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    &lt;div&gt;
      &lt;p&gt;Você clicou {count} vezes&lt;/p&gt;
      &lt;button onClick={() =&gt; setCount(count + 1)}&gt;
        Clique aqui
      &lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
          
          <h3>Eventos</h3>
          <p>React usa SyntheticEvents para lidar com eventos de forma consistente entre diferentes navegadores.</p>
        `,
        summary: 'Aprenda a gerenciar estado e eventos em componentes React'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      quizzes: []
    }
  ]
};

export default function CourseDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CourseViewer 
        courseId={mockCourse.id}
        userId="demo-user-123"
        isAdmin={false}
        mockCourse={mockCourse}
      />
    </div>
  );
}