async function sortByFollowCount(path:string) {

    const file = Bun.file(path);

    const data = await file.json();

    // sort the data by follow_count

    const sorted = data.sort((a:any, b:any) => {
        return b.follow_count - a.follow_count;
    });

    // save the sorted data to a new file
    const secondPath = "./src/data/followers-sorted-by-follow-count.json";
    await Bun.write(secondPath, JSON.stringify(sorted));

    return {
        success: true,
    }
}

export default sortByFollowCount;