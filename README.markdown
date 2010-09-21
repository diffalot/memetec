# System Overview

* an implementation of the metavid/kaltura html5 video sequencer designed for cultural expression rather than academic or archival use
* Memes are stored first by title, then by user, then by timestamp
 * That means that users don't own the idea they are voicing their opinion upon through editing the video, but nonetheless they may take ownership of their manipulation of that idea through urls for their personal edits of the meme, and they can give and take edits from one another within a single meme namespace
 * url paths are:
  * http://mem.ec/
  * <meme_title>/<username>/<timestamp> ::--> That's specific enough.
  * <meme title>/<username> ::--> you get that user's most recent version
  * <meme title> ::--> a version compiled from all edit differences ranked by popularity
   * Based on parent child relationships of the video edit diffs 
   * Popularity of diff segments are tested continually via A/B ranking, on this, the _anti-master_ of the meme
    * merging someone else's edit segment into yours is an A+ for that diff
    * a visitor liking a view containing that diff is an A
    * an editor choosing not to merge your diff back into their edit is a B
    * an editor flagging your diff based on their edit as abuse is a B-
   * (this will not be finished by the conference.  v0.1 of http://mem.ec will display the most popular edit here)

unfinished mem.ec source: http://github.com/papyromancer/memetec

# Notes

I get a little confused about how to synchronize the data store on client with a document storage system on the server side.  It seems that a swarm transport data protocol would be the most effective soilution to sync once on save to the cloud of interested clients.

Android and iPhone upload clients would be nice.

It's important that people be able to add video, audio, images and text from anywhere on the web into their memes, so bookmarklets andextensions are necessary to make viewing any webpage a vector for exploring ones own creativity.

Because so much media is being used, all media should be fingerprinted and compared to existing media by Matching Pursuit to determine if the media is already available in the system at large.  This is a processing intensive task, and should be performed by a dedicated cluster, perhaps diaspora seedboxed would have the extra cycles to perform this task.  If an item is found to exist, it should be pruned from the dataset and its reference replaced with the highest quality version of that media that is available.
