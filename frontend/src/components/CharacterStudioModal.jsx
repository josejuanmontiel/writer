import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Sparkles, Trash2, Edit3, Check, X, Shield, 
  Flame, Key, Heart, Zap, BookOpen, Plus, Copy, FileText
} from 'lucide-react';
import { webBackend } from '../services/webBackend';

const ARCHETYPES = [
  { id: 'protagonista', name: 'Protagonista', icon: '🌟', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  { id: 'antagonista', name: 'Antagonista', icon: '⚡', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
  { id: 'mentor', name: 'Mentor / Sabio', icon: '📜', color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' },
  { id: 'aliado', name: 'Aliado Fiel', icon: '🤝', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  { id: 'sombra', name: 'La Sombra / Traidor', icon: '🌑', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
  { id: 'secundario', name: 'Personaje de Reparto', icon: '👤', color: 'border-slate-500/40 bg-slate-500/10 text-slate-300' }
];

const DEFAULT_CHARACTERS = [
  {
    id: 'char-1',
    name: 'Mateo Valdés',
    archetype: 'protagonista',
    role: 'Relojero y ex-cartógrafo',
    motivation: 'Descubrir el mecanismo secreto que detuvo el tiempo en la catedral.',
    fear: 'Perder los recuerdos de su hija desaparecida.',
    secret: 'Él mismo entregó la llave prohibida hace veinte años.',
    arc: 'De un hombre resignado y culpable a un líder valiente capaz de sacrificar su propio pasado.',
    relationships: 'Enfrentado a la Inquisición, protegido por Doña Clara.'
  },
  {
    id: 'char-2',
    name: 'Inquisidor Sandoval',
    archetype: 'antagonista',
    role: 'Gran Prefecto de la Orden',
    motivation: 'Mantener el orden absoluto sin importar las vidas destruidas.',
    fear: 'Que la verdad sobre su linaje se haga pública.',
    secret: 'Posee el segundo manuscrito prohibido oculto en su celda.',
    arc: 'De la fría convicción a la desesperación y el fanatismo extremo.',
    relationships: 'Persigue implacablemente a Mateo.'
  }
];

export default function CharacterStudioModal({ isOpen, onClose, onInsertIntoEditor }) {
  const [characters, setCharacters] = useState(() => {
    try {
      const saved = localStorage.getItem('antigravity_fiction_characters');
      return saved ? JSON.parse(saved) : DEFAULT_CHARACTERS;
    } catch (e) {
      return DEFAULT_CHARACTERS;
    }
  });

  const [selectedChar, setSelectedChar] = useState(characters[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);

  // Form states
  const [formData, setFormData] = useState(selectedChar || {});

  useEffect(() => {
    if (selectedChar) {
      setFormData(selectedChar);
    }
  }, [selectedChar]);

  const saveToStorage = (updatedList) => {
    setCharacters(updatedList);
    localStorage.setItem('antigravity_fiction_characters', JSON.stringify(updatedList));
  };

  const handleAddNewCharacter = () => {
    const newChar = {
      id: `char-${Date.now()}`,
      name: 'Nuevo Personaje',
      archetype: 'aliado',
      role: '',
      motivation: '',
      fear: '',
      secret: '',
      arc: '',
      relationships: ''
    };
    const updated = [...characters, newChar];
    saveToStorage(updated);
    setSelectedChar(newChar);
    setFormData(newChar);
    setIsEditing(true);
  };

  const handleDeleteCharacter = (charId) => {
    if (window.confirm('¿Eliminar esta ficha de personaje?')) {
      const updated = characters.filter(c => c.id !== charId);
      saveToStorage(updated);
      setSelectedChar(updated[0] || null);
      setIsEditing(false);
    }
  };

  const handleSaveForm = () => {
    const updated = characters.map(c => c.id === formData.id ? formData : c);
    saveToStorage(updated);
    setSelectedChar(formData);
    setIsEditing(false);
  };

  const handleGenerateWithAI = async () => {
    setIsGeneratingWithAI(true);
    try {
      const systemPrompt = `Eres un dramaturgo y consultor narrativo experto en novelas y ficción.
Genera una ficha de personaje profunda con conflicto dramático.
Responde únicamente en formato JSON con la estructura:
{
  "name": "Nombre evocador",
  "role": "Oficio o rol en el mundo",
  "archetype": "protagonista|antagonista|mentor|aliado|sombra",
  "motivation": "Lo que desea desesperadamente",
  "fear": "Su mayor debilidad o temor",
  "secret": "Un secreto inconfesable que cambiaría la trama",
  "arc": "De X a Y (transformación psicológica)",
  "relationships": "Tensión o alianzas clave"
}`;

      const userPrompt = `Crea un personaje para una novela con temática de misterio y aventuras. Arquetipo deseado: ${formData.archetype || 'aliado'}.`;
      const result = await webBackend.ExecuteLLM(systemPrompt, userPrompt);
      
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setFormData(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          role: parsed.role || prev.role,
          motivation: parsed.motivation || prev.motivation,
          fear: parsed.fear || prev.fear,
          secret: parsed.secret || prev.secret,
          arc: parsed.arc || prev.arc,
          relationships: parsed.relationships || prev.relationships
        }));
      }
    } catch (err) {
      console.warn('Error generando personaje con IA:', err);
      alert('Aviso IA: ' + err.message);
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  const handleInsertAsciiDoc = () => {
    if (!selectedChar) return;
    const archObj = ARCHETYPES.find(a => a.id === selectedChar.archetype) || ARCHETYPES[0];
    
    const adoc = `
[NOTE]
.Ficha de Personaje: ${selectedChar.name} (${archObj.name})
====
* **Rol / Ocupación**: ${selectedChar.role || 'No especificado'}
* **Motivación Principal**: ${selectedChar.motivation || 'No especificada'}
* **Mayor Temor**: ${selectedChar.fear || 'No especificado'}
* **Secreto Oculto**: ${selectedChar.secret || 'Ninguno conocido'}
* **Arco de Transformación**: ${selectedChar.arc || 'Arco plano'}
* **Relaciones Clave**: ${selectedChar.relationships || 'Sin registrar'}
====
`;
    if (onInsertIntoEditor) {
      onInsertIntoEditor(adoc);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Dramatis Personae & Arcos Argumentales
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                  Ficción & Narrativa
                </span>
              </h2>
              <p className="text-xs text-slate-400">Crea fichas psicológicas profundas y diseña los conflictos de tu novela.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Lista Lateral de Personajes */}
          <div className="w-72 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between overflow-y-auto space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Personajes ({characters.length})</span>
              </div>

              <div className="space-y-1.5">
                {characters.map((char) => {
                  const arch = ARCHETYPES.find(a => a.id === char.archetype) || ARCHETYPES[5];
                  const isSel = selectedChar?.id === char.id;
                  return (
                    <button
                      key={char.id}
                      onClick={() => {
                        setSelectedChar(char);
                        setIsEditing(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        isSel
                          ? 'bg-purple-600/20 border-purple-500/60 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl">{arch.icon}</span>
                      <div className="truncate flex-1">
                        <div className="font-semibold text-sm truncate">{char.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{arch.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAddNewCharacter}
              className="w-full py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Personaje</span>
            </button>
          </div>

          {/* Panel de Detalle / Edición */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900/40">
            {selectedChar ? (
              <div className="space-y-6 max-w-2xl mx-auto">
                
                {/* Cabecera del Personaje */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl p-3 bg-slate-800 rounded-2xl border border-slate-700">
                      {ARCHETYPES.find(a => a.id === (isEditing ? formData.archetype : selectedChar.archetype))?.icon || '👤'}
                    </div>
                    <div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="text-xl font-bold bg-slate-950 border border-slate-700 rounded-xl px-3 py-1 text-white focus:outline-none focus:border-purple-500"
                        />
                      ) : (
                        <h3 className="text-2xl font-bold text-white">{selectedChar.name}</h3>
                      )}
                      <p className="text-xs text-purple-400 font-medium mt-0.5">
                        {isEditing ? (
                          <select
                            value={formData.archetype}
                            onChange={(e) => setFormData({ ...formData, archetype: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-slate-200"
                          >
                            {ARCHETYPES.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        ) : (
                          ARCHETYPES.find(a => a.id === selectedChar.archetype)?.name
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleGenerateWithAI}
                          disabled={isGeneratingWithAI}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isGeneratingWithAI ? 'animate-spin' : ''}`} />
                          <span>{isGeneratingWithAI ? 'Generando...' : 'Inspirar con IA'}</span>
                        </button>
                        <button
                          onClick={handleSaveForm}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCharacter(selectedChar.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                          title="Eliminar personaje"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Campos Psicológicos y Narrativos */}
                <div className="space-y-4 text-sm">
                  
                  {/* Rol y Ocupación */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Rol / Ocupación en el Mundo:
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.role || ''}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="Ej. Capitán de navío mercante, alquimista proscrito..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        {selectedChar.role || 'Sin definir'}
                      </p>
                    )}
                  </div>

                  {/* Motivación Principal */}
                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      Motivación Principal (¿Qué desea desesperadamente?):
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={formData.motivation || ''}
                        onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        {selectedChar.motivation || 'Sin definir'}
                      </p>
                    )}
                  </div>

                  {/* Mayor Miedo y Secreto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        Mayor Miedo:
                      </label>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={formData.fear || ''}
                          onChange={(e) => setFormData({ ...formData, fear: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      ) : (
                        <p className="text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                          {selectedChar.fear || 'Sin registrar'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5" />
                        Secreto Inconfesable:
                      </label>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={formData.secret || ''}
                          onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      ) : (
                        <p className="text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                          {selectedChar.secret || 'Sin secreto'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Arco de Transformación */}
                  <div>
                    <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      Arco de Transformación (Psicología y Evolución):
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={formData.arc || ''}
                        onChange={(e) => setFormData({ ...formData, arc: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    ) : (
                      <p className="text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        {selectedChar.arc || 'Arco estático'}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Selecciona un personaje o crea uno nuevo para ver su ficha dramática.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg">
            Cerrar
          </button>

          {selectedChar && (
            <button
              onClick={handleInsertAsciiDoc}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Insertar Ficha en el Manuscrito</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
