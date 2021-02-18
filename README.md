**MatRepl**
* is a Matrix
* and a repl: Read–Eval–Print Loop, where Print is doing operations on vectors and matrices in a graphic environment
* written in vanilla javascript (ES6)

![add 2 vectors](screenshot.png? "add 2 vectors")
  
The repl has the following syntax (It's work in progress, new capabilities will be added)
* arithmetic expressions:
  * add, subtract, divide, multiply
* variable declaration eg: a= ...
* vector(1,2,3,4) adds a vector
  * > &gt; vector@0{x0:1, y0: 2, x:3, y:4}
* remove(x) removes bindings (when it's an object (eg vector), removes it from the matrix)
* remove(@x) removes an object using it's assigned index 
* method calls:
  * a = vector(12,1)
  > &gt; vector@0{x0:1, y0: 2, x:12, y:1}
  * a.type()
  > &gt; vector
* property lookup
  * a.x+1
  > &gt; 13
* drag vectors using the mouse pointer. You can change the vector arrows visually
* lazy evaluation. The difference between ```c = a+b``` and ```c = "a+b"``` 
  is that the latter assigns to c a parsed expression that can always be evaluated later. 
  When you apply lazy evaluation and later update ```a```, the value for c will be reevaluated
  automatically. Combined with vector dragging, this way you can get an intuition for vector addition.
  Want to do the same for matrix multiplication and basis change. 

**To run locally**
* make sure you have node/npm
* cmdline: npm run start
* enter the following:
  ```
  a = vector(0.5, 0.5)
  b = vector(-1, 1)
  c = "a+b"
  ```
* and press enter. Then using the mouse pointer move a or b. 
* or type help()