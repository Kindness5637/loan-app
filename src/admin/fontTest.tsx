
const fontTest = () => {
  return (
    <>
    <div className="space-y-4 p-4">
  <h1 className="text-2xl font-bold">Primary Font (Nunito)</h1>
  <h1 className="text-2xl font-bold" style={{fontFamily: 'Nunito'}}>Primary Font (Nunito)</h1>
  <p className="text-lg">This text should be in Nunito regular</p>
  <p className="text-lg" style={{fontFamily: 'Nunito'}}>This text should be in Nunito regular</p>
  <p className="font-medium">This is medium weight</p>
  <p className="font-bold">This is bold weight</p>
  
  <h2 className="text-xl font-bold mt-8">Secondary Font (Poppins)</h2>
  <p className="font-secondary">This text should be in Poppins</p>
  <p className="" style={{fontFamily: 'Poppins'}}>This text should be in Poppins</p>
</div>
    </>
  )
}

export default fontTest