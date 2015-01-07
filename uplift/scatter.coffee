
request = new XMLHttpRequest()
request.open 'GET', 'eigenwords_google.txt', false
request.send null
lines = request.responseText.trim().split("\n")

#lines = lines.slice(0, 5000)

X = new Array(lines.length)
names = new Array(lines.length)
for ln, i in lines
  fields = ln.split(" ")
  names[i] = fields[0]
  X[i] = new Float32Array((parseFloat v for v in fields[1..]))

m = X.length
sums = 0
for row in X
  sums = numeric.add row, sums
means = numeric.div sums, m
means = numeric.rep [m], means
X = numeric.sub X, means

pca = numeric.svd X
xs = numeric.dot X, pca.V[0]
ys = numeric.dot X, pca.V[1]



view_width = 700  # should match .html container size
view_height = 500

Kinetic.pixelRatio = 2

scatter = new Kinetic.Scatter(
  container: 'container'
  width: view_width
  height: view_height
  hitGraphEnabled: false
  draggable: true
)

#xs = xs.slice(0, 10);
#ys = ys.slice(0, 10);

scatter.initPoints(xs, ys)


window.scatter = scatter
#window.data_layer = data_layer
#window.select_layer = select_layer






