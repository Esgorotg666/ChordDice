export default function PentatonicGuide() {
  const pentatonicNotes = [
    { degree: '1', name: 'Root', class: 'bg-primary text-primary-foreground' },
    { degree: '2', name: 'Whole', class: 'bg-accent text-accent-foreground' },
    { degree: '3', name: 'Major 3rd', class: 'bg-primary text-primary-foreground' },
    { degree: '5', name: 'Perfect 5th', class: 'bg-accent text-accent-foreground' },
    { degree: '6', name: 'Major 6th', class: 'bg-primary text-primary-foreground' }
  ];

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <i className="fas fa-guitar mr-2 text-primary"></i>Major Pentatonic Scale Guide
      </h2>
      
      <div className="grid grid-cols-5 gap-2 mb-4">
        {pentatonicNotes.map((note) => (
          <div
            key={note.degree}
            className={`pentatonic-note ${note.class} p-3 rounded-lg text-center font-semibold`}
            data-testid={`pentatonic-note-${note.degree}`}
          >
            <div className="text-lg">{note.degree}</div>
            <div className="text-xs">{note.name}</div>
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground text-center">
        <p className="mb-2">Use these scale degrees for improvisation over your generated chord progressions.</p>
        <p className="text-xs">Colors indicate full steps (green) vs. embellishment opportunities (orange)</p>
      </div>
    </div>
  );
}
