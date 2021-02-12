**MatRepl**
* is a Matrix
* and a repl: Read–Eval–Print Loop, where Print is doing operations on vectors and matrices in a graphic environment

<img src="screenshot1.png"></img>
  
The repl has the following syntax (It's work in progress, new capabilities will be added)
* simple arithmetic expressions: 
  ** add, subtract, divide, multiply
  ** variable declaration eg: a= ...
  ** vector(x0,y0,x,y) adds a vector
  ** remove(x) removes bindings (when it's an object (eg vector), removes it from the matrix)
  ** method calls:
  *** a = vector(0,0,12,1)
  *** a.type()
  *** > vector
  ** property lookup
  *** a.x
  *** 12
  