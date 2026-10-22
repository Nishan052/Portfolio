# feasibility-point-estimate

Claim: A single efficiency curve fitted to published measurements predicts on-device throughput within 30% across platforms.
Status: retired
Evidence: Retired 2026-09-07. A curve fitted to 14 Apple measurements scored 14/14 within 30% in-sample, mean error 7%. Applied to two held-out platforms it missed both by about +49% in the same direction. Replaced by feasibility-ceiling-holds.
Date: 2026-10-21

---
I fitted a curve to 14 Apple chip measurements and it scored 14 out of 14 within 30 percent, and then I ran it on two boards it had never seen.

The idea was one curve that predicts tokens per second for a language model, fitted on how close real chips get to their bandwidth ceiling. On the Apple chips it was excellent, with a mean error of 7 percent.

Then I ran it against a Raspberry Pi 5 and a Jetson Orin Nano Super, both held out of the fit, and it missed both by about 49 percent, in the same direction. The Pi's speed is the middle of a 4 to 6 range from community reports, so treat that number as approximate.

The Apple chips themselves already showed the spread, from 83 percent on a base M2 down to 40 percent on an M1 Ultra, and my guess is that one stream of text can't keep both of the Ultra's dies busy. A curve fitted only to those chips seems to have learned something specific to them.

So I dropped the single number and shipped a ceiling that's never been exceeded by any of the 16 measurements, plus a band of 38 to 85 percent that holds all of them. Wider, and honest about what it doesn't know.

Repo: https://github.com/Nishan052/AgentLake

#EdgeAI #OnDeviceAI #MachineLearning #LLMOps
