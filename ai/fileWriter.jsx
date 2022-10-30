path = encodeURI("/Users/Derrick.Schultz/part1.txt")
HPGLFile = new File(path)
HPGLfile.open("w");
HPGLfile.write( "content!" );
HPGLfile.close();