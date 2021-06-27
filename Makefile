
all: clean example

example: test/example

test/example:
	cd ./test/JacocoAssetBundleExample && ./gradlew jacocoTestReport && cd -
	cp -r ./test/jacocoAssetBundleExample/app/build/jacoco ./test/example
	rm ./test/example/*.exec

clean:
	rm -rf test/example
