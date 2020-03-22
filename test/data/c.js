const csvFilePath='data/be.csv'
const csv=require('csvtojson')

var featureCollection = {
	type: "FeatureCollection",
	name: "Belgium",
	features: []
}

csv()
.fromFile(csvFilePath)
.on('json',(jsonObj)=>{
	var points = []	
	jsonObj.geometry.split(" ").forEach( (point) => {
		var n = point.split(",")
		points.push([parseFloat(n[0]),parseFloat(n[1]),parseFloat(n[2])])
	})

	featureCollection.features.push({
		type: "Feature",
		properties: {
			name: jsonObj.Commune
		},
		geometry: {
			type: "Polygon",
			coordinates: [ points ]
		}
	})
})
.on('done',(error)=>{
	console.log(JSON.stringify(featureCollection, null, 2))
})