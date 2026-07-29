function calculateBMI() {
    // Get values from input fields
    let weight = parseFloat(document.getElementById("weight").value);
    let height = parseFloat(document.getElementById("height").value);
    let resultDiv = document.getElementById("result");

    // Validate inputs
    if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
        resultDiv.style.color = "red";
        resultDiv.innerHTML = "Please enter valid weight and height!";
        return;
    }

    // Convert height from cm to meters
    let heightInMeters = height / 100;

    // Calculate BMI formula: weight (kg) / (height (m) * height (m))
    let bmi = weight / (heightInMeters * heightInMeters);
    let bmiFixed = bmi.toFixed(1);

    // Determine BMI category
    let category = "";
    if (bmi < 18.5) {
        category = "Underweight";
        resultDiv.style.color = "#ff9800";
    } else if (bmi >= 18.5 && bmi < 24.9) {
        category = "Normal weight";
        resultDiv.style.color = "#4caf50";
    } else if (bmi >= 25 && bmi < 29.9) {
        category = "Overweight";
        resultDiv.style.color = "#ff9800";
    } else {
        category = "Obesity";
        resultDiv.style.color = "#f44336";
    }

    // Display the result
    resultDiv.innerHTML = "Your BMI is: " + bmiFixed + "<br>(" + category + ")";
}
