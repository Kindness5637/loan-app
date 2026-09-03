    const PlaceholderPage = ({ title }: { title: string }) => {
    return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">This feature is coming soon...</p>
      </div>
    </div>
    )
  }
  export default PlaceholderPage
